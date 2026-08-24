const dbConnect = require('../services/db');
const Bet = require('../services/betModel');
const Result = require('../services/resultModel');

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

        for (const doc of resultDocs) {
            if (doc.games) {
                const entries = doc.games instanceof Map
                    ? Array.from(doc.games.entries())
                    : Object.entries(doc.games);
                if (entries.length === 0) continue;
                matchdays.push(doc.matchday);
                gamesCountByMatchday[doc.matchday] = entries.length;
                for (const [matchId, game] of entries) {
                    resultGames[matchId] = game;
                }
            }
        }

        const allBets = await Bet.find({}).lean();

        const pointsByUser = {};

        for (const matchday of matchdays) {
            const dayBets = allBets.filter((b) => b.matchday === matchday);

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

            const totalGames = gamesCountByMatchday[matchday];
            for (const user of Object.values(userPoints)) {
                if (totalGames > 0 && user.correct === totalGames) {
                    user.points = 50;
                }
            }

            for (const [userId, data] of Object.entries(userPoints)) {
                if (!pointsByUser[userId]) {
                    pointsByUser[userId] = { points: 0, correct: 0 };
                }
                pointsByUser[userId].points += data.points;
                pointsByUser[userId].correct += data.correct;
            }
        }

        const standings = Object.entries(pointsByUser)
            .map(([userId, data]) => ({
                userId,
                userName: userId.length > 12 ? userId.substring(0, 8) + '...' : userId,
                points: data.points,
                correct: data.correct,
            }))
            .sort((a, b) => b.points - a.points);

        return {
            statusCode: 200,
            headers: HEADERS,
            body: JSON.stringify({ standings }),
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
