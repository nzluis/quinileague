#!/usr/bin/env node
// Actualiza fechas de las próximas jornadas con horarios confirmados
// usando football-data.org (1 petición por ejecución, no recorre jornadas).
//
// Uso:
//   node scripts/update-upcoming.js                # dry-run (no escribe)
//   node scripts/update-upcoming.js --apply        # aplica los cambios
//   node scripts/update-upcoming.js --days=30 --max-matchdays=3
//
// Solo toca partidos con status TIMED (horario oficial). Los SCHEDULED
// (fecha provisional a medianoche) se descartan.

import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Carga .env si las variables no están ya en el entorno (no hay dotenv).
function loadEnv() {
    const envPath = path.join(ROOT, '.env');
    try {
        for (const line of readFileSync(envPath, 'utf8').split('\n')) {
            const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
            if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
        }
    } catch { /* sin .env: confía en el entorno */ }
}
loadEnv();

const MONGODB_URI = process.env.MONGODB_URI;
const FOOTBALL_DATA_TOKEN = process.env.FOOTBALL_DATA_TOKEN;

if (!MONGODB_URI) {
    console.error('MONGODB_URI is required');
    process.exit(1);
}
if (!FOOTBALL_DATA_TOKEN) {
    console.error('FOOTBALL_DATA_TOKEN is required (football-data.org)');
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

// Nombres de football-data.org → nombres cortos de la BD.
// Si aparece un equipo sin mapear, el script falla en vez de adivinar.
const TEAM_ALIASES = {
    'Sevilla FC': 'Sevilla',
    'Deportivo Alavés': 'Alavés',
    'Málaga CF': 'Málaga',
    'Real Racing Club de Santander': 'Racing',
    'RCD Espanyol de Barcelona': 'Espanyol',
    'RC Deportivo La Coruña': 'Deportivo',
    'CA Osasuna': 'Osasuna',
    'Athletic Club': 'Athletic',
    'Valencia CF': 'Valencia',
    'Real Madrid CF': 'Real Madrid',
    'Elche CF': 'Elche',
    'Real Betis Balompié': 'Betis',
    'Real Sociedad de Fútbol': 'Real Sociedad',
    'Rayo Vallecano de Madrid': 'Rayo Vallecano',
    'RC Celta de Vigo': 'Celta',
    'Levante UD': 'Levante',
    'Villarreal CF': 'Villarreal',
    'Getafe CF': 'Getafe',
    'Club Atlético de Madrid': 'Atlético',
    'FC Barcelona': 'Barcelona',
};

function parseArgs() {
    const opts = { apply: false, days: 30, maxMatchdays: 3 };
    for (const arg of process.argv.slice(2)) {
        if (arg === '--apply') opts.apply = true;
        else if (arg.startsWith('--days=')) opts.days = parseInt(arg.split('=')[1], 10);
        else if (arg.startsWith('--max-matchdays=')) opts.maxMatchdays = parseInt(arg.split('=')[1], 10);
        else {
            console.error(`Argumento desconocido: ${arg}`);
            console.error('Uso: node scripts/update-upcoming.js [--apply] [--days=N] [--max-matchdays=N]');
            process.exit(1);
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

// Temporada 2026/27 → 2026_2027 (para las URLs de cotejo de AS).
function asSeason(date) {
    const y = date.getUTCFullYear();
    const seasonStart = date.getUTCMonth() >= 7 ? y : y - 1;
    return `${seasonStart}_${seasonStart + 1}`;
}

async function fetchWindow(from, to) {
    const url = `https://api.football-data.org/v4/competitions/PD/matches?dateFrom=${from}&dateTo=${to}`;
    const res = await fetch(url, { headers: { 'X-Auth-Token': FOOTBALL_DATA_TOKEN } });
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`football-data.org ${res.status}: ${body}`);
    }
    return res.json();
}

async function main() {
    const opts = parseArgs();

    const today = new Date();
    const from = today.toISOString().slice(0, 10);
    const to = new Date(today.getTime() + opts.days * 86400000).toISOString().slice(0, 10);

    console.log(`Ventana: ${from} → ${to} (${opts.days} días, máx. ${opts.maxMatchdays} jornadas)\n`);

    const data = await fetchWindow(from, to);
    const all = data.matches || [];
    const timed = all.filter((m) => m.status === 'TIMED');

    // Jornadas en la ventana sin horario oficial (SCHEDULED u otros): se reportan y saltan.
    const unconfirmedMd = [...new Set(
        all.filter((m) => m.status !== 'TIMED').map((m) => m.matchday)
    )].sort((a, b) => a - b);
    for (const md of unconfirmedMd) {
        const n = all.filter((m) => m.matchday === md).length;
        console.log(`Jornada ${md}: ${n} partidos sin horario oficial (${all.find((m) => m.matchday === md).status}), saltando`);
    }
    if (unconfirmedMd.length) console.log('');

    // Agrupa los TIMED por jornada, ordena y limita a las N primeras.
    const byMd = new Map();
    for (const m of timed) {
        if (!byMd.has(m.matchday)) byMd.set(m.matchday, []);
        byMd.get(m.matchday).push(m);
    }
    const matchdays = [...byMd.keys()].sort((a, b) => a - b).slice(0, opts.maxMatchdays);

    if (matchdays.length === 0) {
        console.log('Ninguna jornada confirmada en la ventana.');
        process.exit(0);
    }

    // URLs de cotejo manual (Marca + AS) para cada jornada a actualizar.
    console.log('Fuentes para cotejar antes de aplicar:');
    console.log('  Marca: https://www.marca.com/futbol/primera-division/calendario.html');
    for (const md of matchdays) {
        console.log(`  AS J${md}: https://as.com/resultados/futbol/primera/${asSeason(today)}/jornada/regular_a_${md}/`);
    }
    console.log('');

    await mongoose.connect(MONGODB_URI);
    console.log('Conectado a MongoDB\n');

    let totalUpdated = 0;
    let totalUnchanged = 0;
    let totalNotFound = 0;
    const unmapped = new Set();

    for (const md of matchdays) {
        console.log(`── Jornada ${md} ──`);
        const matches = byMd.get(md).sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));

        for (const m of matches) {
            const home = TEAM_ALIASES[m.homeTeam.name];
            const away = TEAM_ALIASES[m.awayTeam.name];
            if (!home || !away) {
                unmapped.add(!home ? m.homeTeam.name : m.awayTeam.name);
                console.log(`  Equipo sin mapear: ${!home ? m.homeTeam.name : m.awayTeam.name}`);
                continue;
            }

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
            const newDate = new Date(m.utcDate);

            if (oldDate.getTime() === newDate.getTime()) {
                totalUnchanged++;
                continue;
            }

            console.log(`  ${match.matchId} (${home} vs ${away})`);
            console.log(`    ${formatLocal(oldDate)}  →  ${formatLocal(newDate)}`);

            if (opts.apply) {
                await Match.updateOne({ _id: match._id }, { date: newDate });
            }
            totalUpdated++;
        }
        console.log('');
    }

    console.log('── Resumen ──');
    console.log(`  ${opts.apply ? 'Actualizados' : 'Por actualizar'}: ${totalUpdated}`);
    console.log(`  Sin cambios:  ${totalUnchanged}`);
    console.log(`  No encontrados: ${totalNotFound}`);

    if (unmapped.size) {
        console.log(`\n⚠ Equipos sin mapear en TEAM_ALIASES: ${[...unmapped].join(', ')}`);
        await mongoose.disconnect();
        process.exit(1);
    }

    if (!opts.apply) {
        if (totalUpdated > 0) {
            console.log('\n⚠ Dry-run: no se guardaron cambios.');
            console.log('  Coteja los horarios con Marca/AS y vuelve a ejecutar con --apply.');
        }
    } else {
        console.log('\n✓ Cambios aplicados.');
    }

    await mongoose.disconnect();
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
