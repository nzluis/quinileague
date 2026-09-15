const dbConnect = require('../services/db');
const Bet = require('../services/betModel');
const Result = require('../services/resultModel');
const { getMatchdayStatus } = require('../services/matchdayStatus');

const HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

exports.getStandings = async (event) => {
    try {
        await dbConnect();

        const resultDocs = await Result.find().lean();

        const resultGames = {};
        const gamesCountByMatchday = {};
        const matchdays = [];

        const provisionalMatchdays = [];

        for (const doc of resultDocs) {
            if (doc.games) {
                const entries = doc.games instanceof Map
                    ? Array.from(doc.games.entries())
                    : Object.entries(doc.games);
                if (entries.length === 0) continue;
                matchdays.push(doc.matchday);
                gamesCountByMatchday[doc.matchday] = entries.length;
                if (entries.length < 10) {
                    provisionalMatchdays.push(doc.matchday);
                }
                for (const [matchId, game] of entries) {
                    resultGames[matchId] = game;
                }
            }
        }

        const allBets = await Bet.find({}).lean();

        const pointsByUser = {};
        const pointsByUserComplete = {};

        const allUserIds = [...new Set(allBets.map((b) => b.userId))];

        for (const matchday of matchdays) {
            const dayBets = allBets.filter((b) => b.matchday === matchday);
            const totalGames = gamesCountByMatchday[matchday];
            const isComplete = totalGames >= 10;

            const userPoints = {};
            for (const bet of dayBets) {
                if (!userPoints[bet.userId]) {
                    userPoints[bet.userId] = { points: 0, correct: 0 };
                }
                const game = resultGames[bet.matchId];
                if (!game) continue;
                if (bet.prediction === game.result) {
                    userPoints[bet.userId].points += 3;
                    userPoints[bet.userId].correct += 1;
                }
            }

            for (const user of Object.values(userPoints)) {
                if (isComplete && user.correct === 10) {
                    user.points = 40;
                }
            }

            for (const userId of allUserIds) {
                if (!pointsByUser[userId]) {
                    pointsByUser[userId] = { points: 0, correct: 0, zeros: 0 };
                }

                const hasBet = userPoints[userId] !== undefined;
                if (!hasBet) {
                    pointsByUser[userId].zeros += 1;
                } else {
                    pointsByUser[userId].points += userPoints[userId].points;
                    pointsByUser[userId].correct += userPoints[userId].correct;
                }

                if (isComplete) {
                    if (!pointsByUserComplete[userId]) {
                        pointsByUserComplete[userId] = { points: 0, correct: 0, zeros: 0 };
                    }
                    if (!hasBet) {
                        pointsByUserComplete[userId].zeros += 1;
                    } else {
                        pointsByUserComplete[userId].points += userPoints[userId].points;
                        pointsByUserComplete[userId].correct += userPoints[userId].correct;
                    }
                }
            }
        }

        const sortStandings = (map) => Object.entries(map)
            .map(([userId, data]) => ({ userId, points: data.points, correct: data.correct, zeros: data.zeros }))
            .sort((a, b) => b.points - a.points);

        const standings = sortStandings(pointsByUser);
        const standingsComplete = sortStandings(pointsByUserComplete);

        return {
            statusCode: 200,
            headers: HEADERS,
            body: JSON.stringify({ standings, standingsComplete, provisionalMatchdays }),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            headers: HEADERS,
            body: JSON.stringify({ error: 'Error fetching standings' }),
        };
    }
};
