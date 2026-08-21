const dbConnect = require('../services/db');
const Match = require('../services/matchModel');
const Bet = require('../services/betModel');
const Result = require('../services/resultModel');

const HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

function getActualResult(homeScore, awayScore) {
    if (homeScore > awayScore) return '1';
    if (homeScore < awayScore) return '2';
    return 'X';
}

function calculateMatchdayPoints(bets, matches) {
    const correctByMatch = {};
    for (const m of matches) {
        const result = getActualResult(m.homeScore, m.awayScore);
        correctByMatch[m.matchId] = {
            result,
            correctUsers: [],
        };
    }

    for (const bet of bets) {
        const matchInfo = correctByMatch[bet.matchId];
        if (!matchInfo) continue;
        if (bet.prediction === matchInfo.result) {
            matchInfo.correctUsers.push(bet.userId);
        }
    }

    const usersMap = {};
    for (const bet of bets) {
        if (!usersMap[bet.userId]) {
            usersMap[bet.userId] = { userId: bet.userId, bets: {}, points: 0, correct: 0 };
        }
        const matchInfo = correctByMatch[bet.matchId];
        if (!matchInfo) continue;
        const correct = bet.prediction === matchInfo.result;
        usersMap[bet.userId].bets[bet.matchId] = { prediction: bet.prediction, correct };
        if (correct) {
            usersMap[bet.userId].points += 3;
            usersMap[bet.userId].correct += 1;
        }
    }

    for (const user of Object.values(usersMap)) {
        if (user.correct === 10) {
            user.points = 50;
        }
    }

    return {
        users: Object.values(usersMap),
        summary: Object.fromEntries(
            Object.values(usersMap).map((u) => [u.userId, { points: u.points, correct: u.correct }])
        ),
    };
}

exports.getResults = async (event) => {
    const matchdayParam = event.queryStringParameters?.matchday;
    const matchday = matchdayParam !== undefined ? parseInt(matchdayParam) : null;

    try {
        await dbConnect();

        const finishedMatches = await Match.find({ status: 'finished' })
            .sort({ matchday: -1, date: -1 })
            .lean();

        const resultsByMatchday = finishedMatches.reduce((acc, match) => {
            if (!acc[match.matchday]) acc[match.matchday] = [];
            acc[match.matchday].push(match);
            return acc;
        }, {});

        const results = Object.entries(resultsByMatchday).map(([md, ms]) => ({
            matchday: parseInt(md),
            matches: ms,
        }));

        if (matchday !== null) {
            const dayMatches = resultsByMatchday[matchday];
            if (!dayMatches || dayMatches.length === 0) {
                return {
                    statusCode: 200,
                    headers: HEADERS,
                    body: JSON.stringify({ matchday, matches: [], users: [], summary: {} }),
                };
            }

            const bets = await Bet.find({ matchday }).lean();
            const { users, summary } = calculateMatchdayPoints(bets, dayMatches);

            const matchesWithResult = dayMatches.map((m) => ({
                ...m,
                result: getActualResult(m.homeScore, m.awayScore),
            }));

            return {
                statusCode: 200,
                headers: HEADERS,
                body: JSON.stringify({ matchday, matches: matchesWithResult, users, summary }),
            };
        }

        return {
            statusCode: 200,
            headers: HEADERS,
            body: JSON.stringify({ results }),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            headers: HEADERS,
            body: JSON.stringify({ error: 'Error fetching results' }),
        };
    }
};

exports.createResults = async (event) => {
    try {
        await dbConnect();

        const { matchday, results } = JSON.parse(event.body);

        if (!matchday || !results) {
            return {
                statusCode: 400,
                headers: HEADERS,
                body: JSON.stringify({ error: 'Missing required fields' }),
            };
        }

        for (const result of results) {
            await Match.findOneAndUpdate(
                { matchId: result.matchId },
                { homeScore: result.homeScore, awayScore: result.awayScore, status: 'finished' }
            );
        }

        const bets = await Bet.find({ matchday }).lean();
        const matches = await Match.find({ matchday }).lean();
        const { summary } = calculateMatchdayPoints(bets, matches);

        await Result.deleteMany({ matchday });
        await Result.create({ matchday, points: summary });

        return {
            statusCode: 200,
            headers: HEADERS,
            body: JSON.stringify({ message: 'Results created successfully' }),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            headers: HEADERS,
            body: JSON.stringify({ error: 'Error creating results' }),
        };
    }
};
