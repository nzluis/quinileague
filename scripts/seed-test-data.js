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
    homeScore: Number,
    awayScore: Number,
    status: String,
});

const betSchema = new mongoose.Schema({
    userId: String,
    matchday: Number,
    matchId: String,
    prediction: String,
});

const resultSchema = new mongoose.Schema({
    matchday: Number,
    points: Map,
});

const Match = mongoose.models.Match || mongoose.model('Match', matchSchema);
const Bet = mongoose.models.Bet || mongoose.model('Bet', betSchema);
const Result = mongoose.models.Result || mongoose.model('Result', resultSchema);

const J0_MATCHES = [
    { matchId: 'j0_m1', homeTeam: 'Barcelona', awayTeam: 'Real Madrid', homeScore: 2, awayScore: 1 },
    { matchId: 'j0_m2', homeTeam: 'Atlético', awayTeam: 'Sevilla', homeScore: 1, awayScore: 1 },
    { matchId: 'j0_m3', homeTeam: 'Athletic', awayTeam: 'Betis', homeScore: 0, awayScore: 2 },
    { matchId: 'j0_m4', homeTeam: 'Valencia', awayTeam: 'Málaga', homeScore: 3, awayScore: 0 },
];

const USERS = ['user_alberto', 'user_luis', 'user_maria', 'user_carlos', 'user_ana'];

const BETS = {
    user_alberto: { j0_m1: '1', j0_m2: 'X', j0_m3: '2', j0_m4: '1' },
    user_luis: { j0_m1: '1', j0_m2: 'X', j0_m3: '2', j0_m4: '2' },
    user_maria: { j0_m1: '2', j0_m2: 'X', j0_m3: '2', j0_m4: '1' },
    user_carlos: { j0_m1: '1', j0_m2: '1', j0_m3: '2', j0_m4: '2' },
    user_ana: { j0_m1: '2', j0_m2: '2', j0_m3: '1', j0_m4: 'X' },
};

const CORRECT = { j0_m1: '1', j0_m2: 'X', j0_m3: '2', j0_m4: '1' };

async function seedTestData() {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const m of J0_MATCHES) {
        await Match.updateOne(
            { matchId: m.matchId },
            { homeScore: m.homeScore, awayScore: m.awayScore, status: 'finished' },
            { upsert: true }
        );
        console.log(`Match ${m.matchId}: ${m.homeTeam} ${m.homeScore}-${m.awayScore} ${m.awayTeam}`);
    }

    await Bet.deleteMany({ matchday: 0 });

    for (const userId of USERS) {
        for (const [matchId, prediction] of Object.entries(BETS[userId])) {
            await Bet.create({ userId, matchday: 0, matchId, prediction });
        }
        const correct = Object.values(BETS[userId]).filter((p, i) => p === Object.values(CORRECT)[i]).length;
        console.log(`Bets for ${userId}: ${correct}/4 correct`);
    }

    const resultPoints = {};
    for (const userId of USERS) {
        const bets = await Bet.find({ userId, matchday: 0 }).lean();
        let points = 0, correct = 0;
        for (const bet of bets) {
            if (CORRECT[bet.matchId] === bet.prediction) {
                points += 3;
                correct += 1;
            }
        }
        if (correct === 4) points = 50;
        resultPoints[userId] = { points, correct };
    }

    await Result.deleteOne({ matchday: 0 });
    await Result.create({ matchday: 0, points: resultPoints });

    console.log('\n=== Standings ===');
    const standings = Object.entries(resultPoints)
        .map(([userId, data]) => ({ userId, ...data }))
        .sort((a, b) => b.points - a.points);

    standings.forEach((s, i) => {
        console.log(`${i + 1}. ${s.userId}: ${s.points} pts, ${s.correct} aciertos`);
    });

    await mongoose.disconnect();
    console.log('\nDone');
    process.exit(0);
}

seedTestData().catch((err) => {
    console.error(err);
    process.exit(1);
});
