const dbConnect = require('../services/db');
const Match = require('../services/matchModel');
const Bet = require('../services/betModel');
const Result = require('../services/resultModel');

const HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

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

        const allResults = await Result.find().lean();

        const resultsByMatchday = {};
        for (const r of allResults) {
            const games = r.games instanceof Map ? Object.fromEntries(r.games) : r.games;
            if (games && Object.keys(games).length > 0) {
                const matchIds = Object.keys(games);
                const matches = await Match.find({ matchId: { $in: matchIds } }).lean();
                resultsByMatchday[r.matchday] = matches;
            }
        }

        const results = Object.entries(resultsByMatchday).map(([md, ms]) => ({
            matchday: parseInt(md),
            matches: ms,
        }));

        if (matchday !== null) {
            const dayMatches = resultsByMatchday[matchday];
            if (!dayMatches || dayMatches.length === 0) {
                const resultEntry = await Result.findOne({ matchday }).lean();
                const games = resultEntry?.games 
                    ? (resultEntry.games instanceof Map ? Object.fromEntries(resultEntry.games) : resultEntry.games) 
                    : {};
                return {
                    statusCode: 200,
                    headers: HEADERS,
                    body: JSON.stringify({ matchday, matches: [], users: [], summary: {}, games }),
                };
            }

            const bets = await Bet.find({ matchday }).lean();
            const resultEntry = await Result.findOne({ matchday }).lean();
            const games = resultEntry?.games 
                ? (resultEntry.games instanceof Map ? Object.fromEntries(resultEntry.games) : resultEntry.games) 
                : {};
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

        const games = new Map();
        for (const r of results) {
            const home = parseInt(r.homeScore);
            const away = parseInt(r.awayScore);
            let result;
            if (home > away) result = '1';
            else if (home < away) result = '2';
            else result = 'X';
            games.set(r.matchId, {
                score: `${home}-${away}`,
                result,
            });
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
