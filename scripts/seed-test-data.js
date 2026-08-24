import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI is required');
    process.exit(1);
}

const matchSchema = new mongoose.Schema({
    matchId: String,
    matchday: Number,
    date: Date,
    homeTeam: String,
    awayTeam: String,
});

const betSchema = new mongoose.Schema({
    userId: String,
    matchday: Number,
    matchId: String,
    prediction: String,
});

const resultSchema = new mongoose.Schema({
    matchday: Number,
    games: Map,
});

const Match = mongoose.models.Match || mongoose.model('Match', matchSchema);
const Bet = mongoose.models.Bet || mongoose.model('Bet', betSchema);
const Result = mongoose.models.Result || mongoose.model('Result', resultSchema);

const J0_MATCHES = [
    { matchId: 'j0_m1', homeTeam: 'Barcelona', awayTeam: 'Real Madrid' },
    { matchId: 'j0_m2', homeTeam: 'Atlético', awayTeam: 'Sevilla' },
    { matchId: 'j0_m3', homeTeam: 'Athletic', awayTeam: 'Betis' },
    { matchId: 'j0_m4', homeTeam: 'Valencia', awayTeam: 'Málaga' },
];

const J0_RESULTS = {
    j0_m1: { score: '2-1', result: '1' },
    j0_m2: { score: '1-1', result: 'X' },
    j0_m3: { score: '0-2', result: '2' },
    j0_m4: { score: '3-0', result: '1' },
};

const USERS = ['user_alberto', 'user_luis', 'user_maria', 'user_carlos', 'user_ana', '1199101e-40c1-70ed-9b79-2ce016b38691'];

const BETS = {
    user_alberto: { j0_m1: '1', j0_m2: 'X', j0_m3: '2', j0_m4: '1' },
    user_luis: { j0_m1: '1', j0_m2: 'X', j0_m3: '2', j0_m4: '2' },
    user_maria: { j0_m1: '2', j0_m2: 'X', j0_m3: '2', j0_m4: '1' },
    user_carlos: { j0_m1: '1', j0_m2: '1', j0_m3: '2', j0_m4: '2' },
    user_ana: { j0_m1: '2', j0_m2: '2', j0_m3: '1', j0_m4: 'X' },
    '1199101e-40c1-70ed-9b79-2ce016b38691': { j0_m1: '1', j0_m2: 'X', j0_m3: '2', j0_m4: '1' },
};

async function seedTestData() {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    await Bet.deleteMany({ matchday: 0 });
    console.log('Cleared J0 bets');

    await Result.deleteOne({ matchday: 0 });

    for (const userId of USERS) {
        for (const [matchId, prediction] of Object.entries(BETS[userId])) {
            await Bet.create({ userId, matchday: 0, matchId, prediction });
        }
        const correct = Object.values(BETS[userId]).filter((p, i) => {
            const matchId = Object.keys(BETS[userId])[i];
            return p === J0_RESULTS[matchId].result;
        }).length;
        console.log(`Bets for ${userId}: ${correct}/4 correct`);
    }

    await Result.create({
        matchday: 0,
        games: J0_RESULTS,
    });
    console.log('\nJ0 Result created with games:');
    for (const [matchId, game] of Object.entries(J0_RESULTS)) {
        console.log(`  ${matchId}: ${game.score} (${game.result})`);
    }

    await mongoose.disconnect();
    console.log('\nDone');
    process.exit(0);
}

seedTestData().catch((err) => {
    console.error(err);
    process.exit(1);
});
