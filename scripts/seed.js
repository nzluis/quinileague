import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI is required');
    process.exit(1);
}

const matchSchema = new mongoose.Schema({
    matchId: { type: String, required: true, unique: true },
    matchday: { type: Number, required: true, index: true },
    date: { type: Date, required: true },
    homeTeam: { type: String, required: true },
    awayTeam: { type: String, required: true },
    homeScore: { type: Number, default: null },
    awayScore: { type: Number, default: null },
    status: { type: String, enum: ['scheduled', 'finished'], default: 'scheduled' },
}, { timestamps: true });

const Match = mongoose.models.Match || mongoose.model('Match', matchSchema);

const LA_LIGA_TEAMS_2026_27 = [
    'Alavés',
    'Athletic Club',
    'Atlético de Madrid',
    'Barcelona',
    'Celta de Vigo',
    'Depor',
    'Espanyol',
    'Getafe',
    'Las Palmas',
    'Leganés',
    'Levante',
    'Málaga',
    'Mallorca',
    'Osasuna',
    'Racing',
    'Rayo Vallecano',
    'Real Betis',
    'Real Madrid',
    'Real Sociedad',
    'Sevilla',
    'Valencia',
    'Villarreal',
];

const JORNADAS_1_5 = [
    { matchday: 1, date: '2026-08-15T19:30:00Z', home: 'Alavés', away: 'Getafe' },
    { matchday: 1, date: '2026-08-15T21:30:00Z', home: 'Sevilla', away: 'Rayo Vallecano' },
    { matchday: 1, date: '2026-08-16T17:00:00Z', home: 'Racing', away: 'Villarreal' },
    { matchday: 1, date: '2026-08-16T19:00:00Z', home: 'Espanyol', away: 'Levante' },
    { matchday: 1, date: '2026-08-17T21:00:00Z', home: 'Depor', away: 'Elche' },
    { matchday: 1, date: '2026-08-19T21:00:00Z', home: 'Atlético', away: 'Málaga' },
    { matchday: 1, date: '2026-08-21T20:00:00Z', home: 'Barcelona', away: 'Athletic' },
    { matchday: 1, date: '2026-08-22T18:00:00Z', home: 'Real Madrid', away: 'Real Sociedad' },
    { matchday: 1, date: '2026-08-22T21:00:00Z', home: 'Valencia', away: 'Real Betis' },
    { matchday: 1, date: '2026-08-23T17:00:00Z', home: 'Celta', away: 'Osasuna' },
    { matchday: 2, date: '2026-08-23T20:00:00Z', home: 'Málaga', away: 'Barcelona' },
    { matchday: 2, date: '2026-08-29T18:00:00Z', home: 'Getafe', away: 'Depor' },
    { matchday: 2, date: '2026-08-29T21:00:00Z', home: 'Athletic', away: 'Valencia' },
    { matchday: 2, date: '2026-08-30T17:00:00Z', home: 'Levante', away: 'Racing' },
    { matchday: 2, date: '2026-08-30T19:30:00Z', home: 'Osasuna', away: 'Espanyol' },
    { matchday: 2, date: '2026-08-30T21:30:00Z', home: 'Real Sociedad', away: 'Atlético' },
    { matchday: 2, date: '2026-08-31T17:00:00Z', home: 'Elche', away: 'Real Madrid' },
    { matchday: 2, date: '2026-08-31T19:00:00Z', home: 'Villarreal', away: 'Celta' },
    { matchday: 2, date: '2026-08-31T21:00:00Z', home: 'Rayo Vallecano', away: 'Sevilla' },
    { matchday: 2, date: '2026-09-01T21:00:00Z', home: 'Real Betis', away: 'Alavés' },
    { matchday: 3, date: '2026-09-13T17:00:00Z', home: 'Barcelona', away: 'Real Betis' },
    { matchday: 3, date: '2026-09-13T19:30:00Z', home: 'Atlético', away: 'Levante' },
    { matchday: 3, date: '2026-09-13T22:00:00Z', home: 'Real Madrid', away: 'Getafe' },
    { matchday: 3, date: '2026-09-14T17:00:00Z', home: 'Depor', away: 'Málaga' },
    { matchday: 3, date: '2026-09-14T19:30:00Z', home: 'Espanyol', away: 'Rayo Vallecano' },
    { matchday: 3, date: '2026-09-14T22:00:00Z', home: 'Valencia', away: 'Athletic' },
    { matchday: 3, date: '2026-09-15T19:00:00Z', home: 'Celta', away: 'Alavés' },
    { matchday: 3, date: '2026-09-15T21:30:00Z', home: 'Racing', away: 'Osasuna' },
    { matchday: 3, date: '2026-09-16T21:00:00Z', home: 'Sevilla', away: 'Villarreal' },
    { matchday: 3, date: '2026-09-17T19:00:00Z', home: 'Elche', away: 'Real Sociedad' },
    { matchday: 4, date: '2026-09-20T14:00:00Z', home: 'Alavés', away: 'Depor' },
    { matchday: 4, date: '2026-09-20T17:00:00Z', home: 'Athletic', away: 'Elche' },
    { matchday: 4, date: '2026-09-20T19:30:00Z', home: 'Getafe', away: 'Barcelona' },
    { matchday: 4, date: '2026-09-20T22:00:00Z', home: 'Levante', away: 'Sevilla' },
    { matchday: 4, date: '2026-09-21T14:00:00Z', home: 'Málaga', away: 'Racing' },
    { matchday: 4, date: '2026-09-21T17:00:00Z', home: 'Osasuna', away: 'Valencia' },
    { matchday: 4, date: '2026-09-21T19:30:00Z', home: 'Rayo Vallecano', away: 'Atlético' },
    { matchday: 4, date: '2026-09-21T22:00:00Z', home: 'Real Sociedad', away: 'Espanyol' },
    { matchday: 4, date: '2026-09-22T21:00:00Z', home: 'Villarreal', away: 'Real Madrid' },
    { matchday: 4, date: '2026-09-23T21:00:00Z', home: 'Real Betis', away: 'Celta' },
    { matchday: 5, date: '2026-09-27T14:00:00Z', home: 'Barcelona', away: 'Osasuna' },
    { matchday: 5, date: '2026-09-27T17:00:00Z', home: 'Atlético', away: 'Alavés' },
    { matchday: 5, date: '2026-09-27T19:30:00Z', home: 'Celta', away: 'Getafe' },
    { matchday: 5, date: '2026-09-27T22:00:00Z', home: 'Real Madrid', away: 'Málaga' },
    { matchday: 5, date: '2026-09-28T14:00:00Z', home: 'Elche', away: 'Levante' },
    { matchday: 5, date: '2026-09-28T17:00:00Z', home: 'Espanyol', away: 'Real Betis' },
    { matchday: 5, date: '2026-09-28T19:30:00Z', home: 'Racing', away: 'Barcelona' },
    { matchday: 5, date: '2026-09-28T22:00:00Z', home: 'Valencia', away: 'Villarreal' },
    { matchday: 5, date: '2026-09-29T21:00:00Z', home: 'Depor', away: 'Real Sociedad' },
    { matchday: 5, date: '2026-09-30T19:00:00Z', home: 'Sevilla', away: 'Athletic' },
];

const ALL_MATCHES = [];

for (let i = 1; i <= 38; i++) {
    const jornadaFixtures = JORNADAS_1_5.filter(m => m.matchday === i);
    if (jornadaFixtures.length > 0) {
        jornadaFixtures.forEach((f, idx) => {
            ALL_MATCHES.push({
                matchId: `j${i}_m${idx + 1}`,
                matchday: i,
                date: new Date(f.date),
                homeTeam: f.home,
                awayTeam: f.away,
            });
        });
    } else {
        const baseDate = new Date('2026-08-15T12:00:00Z');
        baseDate.setDate(baseDate.getDate() + (i - 1) * 7);
        for (let j = 0; j < 10; j++) {
            ALL_MATCHES.push({
                matchId: `j${i}_m${j + 1}`,
                matchday: i,
                date: new Date(baseDate.getTime() + j * 3600000 * 4),
                homeTeam: LA_LIGA_TEAMS_2026_27[(i + j) % 22],
                awayTeam: LA_LIGA_TEAMS_2026_27[(i + j + 11) % 22],
            });
        }
    }
}

async function seed() {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    await Match.deleteMany({});
    console.log('Cleared existing matches');

    await Match.insertMany(ALL_MATCHES);
    console.log(`Inserted ${ALL_MATCHES.length} matches for 38 matchdays`);

    await mongoose.disconnect();
    process.exit(0);
}

seed().catch((err) => {
    console.error(err);
    process.exit(1);
});
