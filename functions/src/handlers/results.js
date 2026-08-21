const dbConnect = require('../services/db');
const Match = require('../services/matchModel');
const Bet = require('../services/betModel');
const Result = require('../services/resultModel');

const HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

function scoreToResult(score) {
    if (!score) return null;
    const [home, away] = score.split('-').map(Number);
    if (isNaN(home) || isNaN(away)) return null;
    if (home > away) return '1';
    if (home < away) return '2';
    return 'X';
}

function deriveResultFromMatches(matches) {
    return matches.reduce((acc, m) => {
        if (m.homeScore !== null && m.awayScore !== null) {
            acc[m.matchId] = {
                score: `${m.homeScore}-${m.awayScore}`,
                result: scoreToResult(`${m.homeScore}-${m.awayScore}`),
            };
        }
        return acc;
    }, {});
}

function calculateMatchdayPoints(bets, games) {
    const usersMap = {};
    for (const bet of bets) {
        if (!usersMap[bet.userId]) {
            usersMap[bet.userId] = { userId: bet.userId, bets: {}, points: 0, correct: 0 };
        }
        const game = games?.[bet.matchId];
        if (!game) continue;
        const correct = bet.prediction === game.result;
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
                const resultEntry = await Result.findOne({ matchday }).lean();
                const games = resultEntry?.games || {};
                return {
                    statusCode: 200,
                    headers: HEADERS,
                    body: JSON.stringify({ matchday, matches: [], users: [], summary: {}, games }),
                };
            }

            const bets = await Bet.find({ matchday }).lean();
            const resultEntry = await Result.findOne({ matchday }).lean();
            const games = resultEntry?.games || deriveResultFromMatches(dayMatches);
            const { users, summary } = calculateMatchdayPoints(bets, games);

            const matchesWithResult = dayMatches.map((m) => {
                const game = games[m.matchId];
                return { ...m, score: game?.score || null, result: game?.result || null };
            });

            return {
                statusCode: 200,
                headers: HEADERS,
                body: JSON.stringify({ matchday, matches: matchesWithResult, users, summary, games }),
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

        const games = {};
        for (const r of results) {
            await Match.findOneAndUpdate(
                { matchId: r.matchId },
                { homeScore: r.homeScore, awayScore: r.awayScore, status: 'finished' }
            );
            games[r.matchId] = {
                score: `${r.homeScore}-${r.awayScore}`,
                result: scoreToResult(`${r.homeScore}-${r.awayScore}`),
            };
        }

        await Result.deleteMany({ matchday });
        await Result.create({ matchday, games });

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
