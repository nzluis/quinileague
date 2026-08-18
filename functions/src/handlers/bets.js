const dbConnect = require('../services/db');
const Bet = require('../services/betModel');
const Match = require('../services/matchModel');

exports.getBets = async (event) => {
    try {
        await dbConnect();

        const matchday = parseInt(event.queryStringParameters?.matchday) || 1;

        const bets = await Bet.find({ matchday }).lean();

        return {
            statusCode: 200,
            body: JSON.stringify({ bets }),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error fetching bets' }),
        };
    }
};

exports.createBet = async (event) => {
    try {
        await dbConnect();

        const { matchday, userId, bets } = JSON.parse(event.body);

        if (!matchday || !userId || !bets) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required fields' }),
            };
        }

        const now = new Date();
        const firstMatch = await Match.findOne({ matchday }).sort({ date: 1 }).lean();

        if (firstMatch && new Date(firstMatch.date) <= now) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Deadline has passed' }),
            };
        }

        const deadline = new Date(firstMatch.date);
        deadline.setHours(deadline.getHours() - 1);

        if (now > deadline) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Deadline has passed' }),
            };
        }

        const validPredictions = ['1', 'X', '2'];
        for (const bet of bets) {
            if (!validPredictions.includes(bet.prediction)) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        error: `Invalid prediction '${bet.prediction}' for match ${bet.matchId}. Must be 1, X, or 2`,
                    }),
                };
            }
        }

        await Bet.deleteMany({ userId, matchday });

        const betDocs = bets.map((bet) => ({
            userId,
            matchday,
            matchId: bet.matchId,
            prediction: bet.prediction,
        }));

        await Bet.insertMany(betDocs);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Bet created successfully' }),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error creating bet' }),
        };
    }
};
