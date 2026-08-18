const dbConnect = require('../services/db');
const Match = require('../services/matchModel');

exports.getMatches = async (event) => {
    try {
        await dbConnect();

        const matchday = parseInt(event.queryStringParameters?.matchday) || 1;

        const matches = await Match.find({ matchday })
            .sort({ date: 1 })
            .lean();

        return {
            statusCode: 200,
            body: JSON.stringify({ matches }),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error fetching matches' }),
        };
    }
};

exports.getNextMatchday = async (event) => {
    try {
        await dbConnect();

        const now = new Date();
        const nextMatch = await Match.findOne({
            date: { $gt: now },
            status: 'scheduled',
        })
            .sort({ date: 1 })
            .lean();

        if (!nextMatch) {
            return {
                statusCode: 200,
                body: JSON.stringify({ matchday: null, deadline: null }),
            };
        }

        const deadline = new Date(nextMatch.date);
        deadline.setHours(deadline.getHours() - 1);

        return {
            statusCode: 200,
            body: JSON.stringify({
                matchday: nextMatch.matchday,
                deadline: deadline.toISOString(),
                firstMatchDate: nextMatch.date,
            }),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error fetching next matchday' }),
        };
    }
};
