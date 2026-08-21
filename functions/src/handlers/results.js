const dbConnect = require('../services/db');
const Match = require('../services/matchModel');
const Bet = require('../services/betModel');
const Result = require('../services/resultModel');

const HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

function calculatePoints(prediction, actualHomeScore, actualAwayScore) {
    if (actualHomeScore === null || actualAwayScore === null) return 0;

    let actualResult;
    if (actualHomeScore > actualAwayScore) actualResult = '1';
    else if (actualHomeScore < actualAwayScore) actualResult = '2';
    else actualResult = 'X';

    if (prediction === actualResult) return 3;
    return 0;
}

exports.getResults = async (event) => {
    const matchdayParam = event.queryStringParameters?.matchday;
    const matchday = matchdayParam !== undefined ? parseInt(matchdayParam) : null;

    try {
        await dbConnect();

        const matches = await Match.find({ status: 'finished' })
            .sort({ matchday: -1, date: -1 })
            .lean();

        const resultsByMatchday = matches.reduce((acc, match) => {
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
            const resultEntry = await Result.findOne({ matchday }).lean();

            const usersMap = {};
            for (const bet of bets) {
                if (!usersMap[bet.userId]) {
                    usersMap[bet.userId] = { userId: bet.userId, bets: {} };
                }
                const match = dayMatches.find((m) => m.matchId === bet.matchId);
                if (!match) continue;
                let actualResult;
                if (match.homeScore > match.awayScore) actualResult = '1';
                else if (match.homeScore < match.awayScore) actualResult = '2';
                else actualResult = 'X';
                const correct = bet.prediction === actualResult;
                usersMap[bet.userId].bets[bet.matchId] = { prediction: bet.prediction, correct };
            }

            const users = Object.values(usersMap);

            let summary = {};
            if (resultEntry && resultEntry.points) {
                summary = resultEntry.points;
            } else {
                for (const user of users) {
                    if (!summary[user.userId]) summary[user.userId] = { points: 0, correct: 0 };
                    for (const bet of Object.values(user.bets)) {
                        if (bet.correct) { summary[user.userId].points += 3; summary[user.userId].correct += 1; }
                    }
                }
            }

            const matchesWithResult = dayMatches.map((m) => {
                let actualResult;
                if (m.homeScore > m.awayScore) actualResult = '1';
                else if (m.homeScore < m.awayScore) actualResult = '2';
                else actualResult = 'X';
                return { ...m, result: actualResult };
            });

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

        const pointsMap = {};
        for (const bet of bets) {
            const match = matches.find((m) => m.matchId === bet.matchId);
            if (!match) continue;
            if (!pointsMap[bet.userId]) pointsMap[bet.userId] = { points: 0, correct: 0 };
            const points = calculatePoints(bet.prediction, match.homeScore, match.awayScore);
            pointsMap[bet.userId].points += points;
            if (points === 3) pointsMap[bet.userId].correct += 1;
        }

        const resultEntry = await Result.findOne({ matchday });
        if (resultEntry) {
            resultEntry.points = pointsMap;
            await resultEntry.save();
        } else {
            await Result.create({ matchday, points: pointsMap });
        }

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
