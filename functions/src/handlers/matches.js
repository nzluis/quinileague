const dbConnect = require('../services/db');
const Match = require('../services/matchModel');
const Result = require('../services/resultModel');
const { getMatchdayStatus } = require('../services/matchdayStatus');

const HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

exports.getMatches = async (event) => {
    try {
        await dbConnect();

        const matchday = parseInt(event.queryStringParameters?.matchday) || 1;

        const matches = await Match.find({ matchday })
            .sort({ date: 1 })
            .lean();

        const resultEntry = await Result.findOne({ matchday }).lean();
        const games = resultEntry?.games
            ? (resultEntry.games instanceof Map ? Object.fromEntries(resultEntry.games) : resultEntry.games)
            : {};

        const enriched = matches.map((m) => ({
            ...m,
            score: games[m.matchId]?.score || null,
            result: games[m.matchId]?.result || null,
        }));

        return {
            statusCode: 200,
            headers: HEADERS,
            body: JSON.stringify({ matches: enriched }),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            headers: HEADERS,
            body: JSON.stringify({ error: 'Error fetching matches' }),
        };
    }
};

exports.getNextMatchday = async (event) => {
    try {
        await dbConnect();

        const requestedMatchday = parseInt(event.queryStringParameters?.matchday) || null;
        const now = new Date();

        if (requestedMatchday) {
            const firstMatch = await Match.findOne({ matchday: requestedMatchday })
                .sort({ date: 1 })
                .lean();

            if (!firstMatch) {
                return {
                    statusCode: 200,
                    headers: HEADERS,
                    body: JSON.stringify({ matchday: null, deadline: null }),
                };
            }

            const deadline = new Date(firstMatch.date);
            deadline.setMinutes(deadline.getMinutes() - 5);

            return {
                statusCode: 200,
                headers: HEADERS,
                body: JSON.stringify({
                    matchday: requestedMatchday,
                    deadline: deadline.toISOString(),
                    firstMatchDate: firstMatch.date,
                }),
            };
        }

        const resultDocs = await Result.find().lean();
        const finishedMatchdays = new Set();
        for (const doc of resultDocs) {
            const games = doc.games instanceof Map ? Object.fromEntries(doc.games) : doc.games;
            const status = getMatchdayStatus(games);
            if (status.complete) {
                finishedMatchdays.add(doc.matchday);
            }
        }

        const nextMatch = await Match.findOne({
            date: { $gt: now },
            matchday: { $nin: Array.from(finishedMatchdays) },
        })
            .sort({ date: 1 })
            .lean();

        if (!nextMatch) {
            return {
                statusCode: 200,
                headers: HEADERS,
                body: JSON.stringify({ matchday: null, deadline: null }),
            };
        }

        const deadline = new Date(nextMatch.date);
        deadline.setMinutes(deadline.getMinutes() - 5);

        return {
            statusCode: 200,
            headers: HEADERS,
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
            headers: HEADERS,
            body: JSON.stringify({ error: 'Error fetching next matchday' }),
        };
    }
};
