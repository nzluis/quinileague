const dbConnect = require('../services/db');
const Match = require('../services/matchModel');
const Bet = require('../services/betModel');
const Result = require('../services/resultModel');

const HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

function deriveResultFromMatches(matches) {
    return matches.reduce((acc, m) => {
        if (m.homeScore !== null && m.awayScore !== null) {
            const home = m.homeScore;
            const away = m.awayScore;
            let result;
            if (home > away) result = '1';
            else if (home < away) result = '2';
            else result = 'X';
            acc[m.matchId] = { score: `${home}-${away}`, result };
        }
        return acc;
    }, {});
}

exports.getStandings = async (event) => {
    try {
        await dbConnect();

        const finishedMatches = await Match.find({ status: 'finished' }).lean();
        const resultDocs = await Result.find().lean();

        const resultGames = {};
        for (const doc of resultDocs) {
            if (doc.games) {
                const entries = doc.games instanceof Map
                    ? Array.from(doc.games.entries())
                    : Object.entries(doc.games);
                for (const [matchId, game] of entries) {
                    resultGames[matchId] = game;
                }
            }
        }

        const matchdays = [...new Set(finishedMatches.map((m) => m.matchday))];

        const allBets = await Bet.find({}).lean();

        const pointsByUser = {};

        for (const matchday of matchdays) {
            const dayMatches = finishedMatches.filter((m) => m.matchday === matchday);
            const dayBets = allBets.filter((b) => b.matchday === matchday);

            const games = {};
            for (const m of dayMatches) {
                const fromResult = resultGames[m.matchId];
                if (fromResult) {
                    games[m.matchId] = fromResult;
                } else if (m.homeScore !== null && m.awayScore !== null) {
                    games[m.matchId] = {
                        score: `${m.homeScore}-${m.awayScore}`,
                        result: m.homeScore > m.awayScore ? '1' : m.homeScore < m.awayScore ? '2' : 'X',
                    };
                }
            }

            const userPoints = {};
            for (const bet of dayBets) {
                if (!userPoints[bet.userId]) {
                    userPoints[bet.userId] = { points: 0, correct: 0 };
                }
                const game = games[bet.matchId];
                if (!game) continue;
                if (bet.prediction === game.result) {
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
