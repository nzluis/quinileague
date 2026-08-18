const dbConnect = require('../services/db');
const Result = require('../services/resultModel');

const HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

exports.getStandings = async (event) => {
    try {
        await dbConnect();

        const results = await Result.find().lean();

        const pointsByUser = {};

        for (const result of results) {
            if (!result.points) continue;

            for (const [userId, data] of result.points) {
                if (!pointsByUser[userId]) {
                    pointsByUser[userId] = { points: 0, correct: 0 };
                }
                pointsByUser[userId].points += data.points || 0;
                pointsByUser[userId].correct += data.correct || 0;
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
