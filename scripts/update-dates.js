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
}, { timestamps: true });

const Match = mongoose.models.Match || mongoose.model('Match', matchSchema);

// ──────────────────────────────────────────────────────────
// Horarios oficiales La Liga 2025/26 (fuente: Marca)
// Fechas en UTC (convertidas desde hora peninsular CEST/CET).
// Busca por matchday + homeTeam + awayTeam, no por matchId.
// ──────────────────────────────────────────────────────────

const SCHEDULE_OVERRIDES = {
    5: [
        { home: 'Sevilla',        away: 'Valencia',         date: '2026-09-11T19:00:00Z' },
        { home: 'Racing',         away: 'Alavés',           date: '2026-09-12T12:00:00Z' },
        { home: 'Osasuna',        away: 'Espanyol',         date: '2026-09-12T14:15:00Z' },
        { home: 'Athletic',       away: 'Elche',            date: '2026-09-12T16:30:00Z' },
        { home: 'Real Madrid',    away: 'Rayo Vallecano',   date: '2026-09-12T19:00:00Z' },
        { home: 'Celta',          away: 'Málaga',           date: '2026-09-13T12:00:00Z' },
        { home: 'Levante',        away: 'Barcelona',        date: '2026-09-13T14:15:00Z' },
        { home: 'Getafe',         away: 'Deportivo',        date: '2026-09-13T16:30:00Z' },
        { home: 'Real Sociedad',  away: 'Atlético',         date: '2026-09-13T19:00:00Z' },
        { home: 'Villarreal',     away: 'Betis',            date: '2026-09-14T19:00:00Z' },
    ],
    6: [
        // Real Sociedad vs Celta ya jugado 03/09 — no incluir
        { home: 'Rayo Vallecano', away: 'Espanyol',         date: '2026-09-15T17:00:00Z' },
        { home: 'Alavés',         away: 'Valencia',         date: '2026-09-15T18:00:00Z' },
        { home: 'Elche',          away: 'Real Madrid',      date: '2026-09-15T19:30:00Z' },
        { home: 'Atlético',       away: 'Osasuna',          date: '2026-09-16T17:00:00Z' },
        { home: 'Deportivo',      away: 'Sevilla',          date: '2026-09-16T17:00:00Z' },
        { home: 'Barcelona',      away: 'Racing',           date: '2026-09-16T19:30:00Z' },
        { home: 'Levante',        away: 'Athletic',         date: '2026-09-16T19:30:00Z' },
        { home: 'Betis',          away: 'Getafe',           date: '2026-09-17T17:00:00Z' },
        { home: 'Málaga',         away: 'Villarreal',       date: '2026-09-17T19:30:00Z' },
    ],
    7: [
        { home: 'Espanyol',       away: 'Elche',            date: '2026-09-18T19:00:00Z' },
        { home: 'Osasuna',        away: 'Rayo Vallecano',   date: '2026-09-19T12:00:00Z' },
        { home: 'Athletic',       away: 'Alavés',           date: '2026-09-19T14:15:00Z' },
        { home: 'Celta',          away: 'Racing',           date: '2026-09-19T16:30:00Z' },
        { home: 'Sevilla',        away: 'Barcelona',        date: '2026-09-19T19:00:00Z' },
        { home: 'Getafe',         away: 'Málaga',           date: '2026-09-20T12:00:00Z' },
        { home: 'Atlético',       away: 'Real Madrid',      date: '2026-09-20T14:15:00Z' },
        { home: 'Deportivo',      away: 'Betis',            date: '2026-09-20T16:30:00Z' },
        { home: 'Villarreal',     away: 'Levante',          date: '2026-09-20T16:30:00Z' },
        { home: 'Valencia',       away: 'Real Sociedad',    date: '2026-09-20T19:00:00Z' },
    ],
};

function parseArgs() {
    const args = process.argv.slice(2);
    const opts = { from: null, dryRun: false, matchday: null };

    for (const arg of args) {
        if (arg.startsWith('--from=')) {
            opts.from = parseInt(arg.split('=')[1], 10);
        } else if (arg === '--dry-run') {
            opts.dryRun = true;
        } else if (arg.startsWith('--matchday=')) {
            opts.matchday = parseInt(arg.split('=')[1], 10);
        }
    }

    return opts;
}

function formatLocal(date) {
    return date.toLocaleString('es-ES', {
        timeZone: 'Europe/Madrid',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

async function main() {
    const opts = parseArgs();
    const matchdays = opts.matchday
        ? [opts.matchday]
        : Object.keys(SCHEDULE_OVERRIDES)
            .map(Number)
            .filter((md) => (opts.from ? md >= opts.from : true))
            .sort((a, b) => a - b);

    if (matchdays.length === 0) {
        console.log('No hay jornadas para actualizar.');
        console.log('Jornadas disponibles:', Object.keys(SCHEDULE_OVERRIDES).join(', '));
        console.log('Uso: node scripts/update-dates.js [--from=N] [--matchday=N] [--dry-run]');
        process.exit(0);
    }

    await mongoose.connect(MONGODB_URI);
    console.log('Conectado a MongoDB\n');

    let totalUpdated = 0;
    let totalUnchanged = 0;
    let totalNotFound = 0;

    for (const md of matchdays) {
        const overrides = SCHEDULE_OVERRIDES[md];
        if (!overrides) {
            console.log(`Jornada ${md}: sin datos de horarios, saltando`);
            continue;
        }

        console.log(`── Jornada ${md} ──`);

        for (const { home, away, date: newDateStr } of overrides) {
            const match = await Match.findOne({
                matchday: md,
                homeTeam: home,
                awayTeam: away,
            }).lean();

            if (!match) {
                console.log(`  ${home} vs ${away}: no encontrado en BD`);
                totalNotFound++;
                continue;
            }

            const oldDate = match.date;
            const newDate = new Date(newDateStr);

            if (oldDate.getTime() === newDate.getTime()) {
                totalUnchanged++;
                continue;
            }

            const oldLocal = formatLocal(oldDate);
            const newLocal = formatLocal(newDate);

            console.log(`  ${match.matchId} (${home} vs ${away})`);
            console.log(`    ${oldLocal}  →  ${newLocal}`);

            if (!opts.dryRun) {
                await Match.updateOne(
                    { _id: match._id },
                    { date: newDate }
                );
            }
            totalUpdated++;
        }

        console.log('');
    }

    console.log('── Resumen ──');
    console.log(`  Actualizados: ${totalUpdated}`);
    console.log(`  Sin cambios:  ${totalUnchanged}`);
    console.log(`  No encontrados: ${totalNotFound}`);

    if (opts.dryRun) {
        console.log('\n⚠ Modo dry-run: no se guardaron cambios');
    }

    await mongoose.disconnect();
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
