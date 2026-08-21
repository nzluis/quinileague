const dbConnect = require('../services/db');
const Match = require('../services/matchModel');
const Bet = require('../services/betModel');

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

exports.getStandings = async (event) => {
    try {
        await dbConnect();

        const finishedMatches = await Match.find({ status: 'finished' }).lean();

        const matchdays = [...new Set(finishedMatches.map((m) => m.matchday))];

        const allBets = await Bet.find({}).lean();

        const pointsByUser = {};

        for (const matchday of matchdays) {
            const dayMatches = finishedMatches.filter((m) => m.matchday === matchday);
            const dayBets = allBets.filter((b) => b.matchday === matchday);

            const correctByMatch = {};
            for (const m of dayMatches) {
                correctByMatch[m.matchId] = {
                    result: getActualResult(m.homeScore, m.awayScore),
                    correctUsers: [],
                };
            }
            for (const bet of dayBets) {
                const info = correctByMatch[bet.matchId];
                if (!info) continue;
                if (bet.prediction === info.result) {
                    info.correctUsers.push(bet.userId);
                }
            }

            const userPoints = {};
            for (const bet of dayBets) {
                if (!userPoints[bet.userId]) {
                    userPoints[bet.userId] = { points: 0, correct: 0 };
                }
                const info = correctByMatch[bet.matchId];
                if (!info) continue;
                if (bet.prediction === info.result) {
                    userPoints[bet.userId].points += 3;
                    userPoints[bet.userId].correct += 1;
                }
            }

            for (const user of Object.values(userPoints)) {
                if (user.correct === 10) {
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
                userName: userId,
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
