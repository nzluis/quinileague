const dbConnect = require('../services/db');
const Match = require('../services/matchModel');
const Bet = require('../services/betModel');
const Result = require('../services/resultModel');
const { getMatchdayStatus } = require('../services/matchdayStatus');

const HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

const USER_IDS = [
    '61d900fe-30e1-70c5-2e71-bcd4b4eb8336',
    '4119702e-8051-7068-974e-78000970175f',
    'b1e9f08e-6061-70ae-944c-eaa4151d8262',
    'd159607e-1021-7098-9ee1-d1a7a8fed14a',
    '210920ee-a0f1-70fc-8cdb-e50bd7ec6c4f',
    '2199804e-a051-707b-d00a-f2061effc94e',
    '51f9c06e-f031-70b0-1e1a-4a51c654d36b',
    'b1d900de-9081-7005-37ec-dea2f3b76424',
    'c1d9005e-b081-7090-e372-99efaa9eab1f',
    '2199f05e-e0f1-7088-1790-632aea41b266',
    'a1c9405e-60f1-7076-1515-2ce82bce6227',
    'e1e950ee-1011-70fe-a066-d28451dadaf0',
    '7129f08e-50a1-70d1-ad27-862dcba45053',
    'e1f9806e-60f1-70bb-9c77-c035e299c55c',
    '4159d01e-f001-705f-b0ce-0d83d6756592',
];

exports.getMissingBets = async () => {
    try {
        await dbConnect();

        const now = new Date();
        const tenDaysFromNow = new Date(now);
        tenDaysFromNow.setDate(tenDaysFromNow.getDate() + 10);

        const matches = await Match.find().sort({ date: 1 }).lean();

        const matchdayMap = matches.reduce((acc, match) => {
            if (acc[match.matchday]) return acc;

            const deadline = new Date(match.date);
            deadline.setMinutes(deadline.getMinutes() - 5);

            if (deadline <= now) return acc;
            if (deadline > tenDaysFromNow) return acc;

            acc[match.matchday] = {
                matchday: match.matchday,
                deadline: deadline.toISOString(),
                firstMatchDate: match.date,
            };

            return acc;
        }, {});

        const matchdays = Object.values(matchdayMap).sort((a, b) =>
            new Date(a.deadline) - new Date(b.deadline)
        );

        if (matchdays.length === 0) {
            return {
                statusCode: 200,
                headers: HEADERS,
                body: JSON.stringify({ matchdays: [], deadlineDates: [] }),
            };
        }

        const result = [];

        for (const md of matchdays) {
            const existingBets = await Bet.find({ matchday: md.matchday }).lean();
            const usersWhoBet = new Set(existingBets.map(b => b.userId));
            const missingUsers = USER_IDS.filter(uid => !usersWhoBet.has(uid));

            result.push({
                matchday: md.matchday,
                deadline: md.deadline,
                firstMatchDate: md.firstMatchDate,
                missingUsers,
            });
        }

        const deadlineDates = matchdays.map(m => m.deadline);

        return {
            statusCode: 200,
            headers: HEADERS,
            body: JSON.stringify({
                deadlineDates,
                matchdays: result,
            }),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            headers: HEADERS,
            body: JSON.stringify({ error: 'Error checking missing bets' }),
        };
    }
};

exports.getMatchdayStatuses = async () => {
    try {
        await dbConnect();

        const now = new Date();

        const allMatches = await Match.find().sort({ date: 1 }).lean();
        const firstMatchByMatchday = {};
        for (const m of allMatches) {
            if (!firstMatchByMatchday[m.matchday]) {
                firstMatchByMatchday[m.matchday] = m;
            }
        }

        const allResults = await Result.find().lean();
        const resultByMatchday = {};
        for (const r of allResults) {
            const games = r.games instanceof Map ? Object.fromEntries(r.games) : r.games;
            resultByMatchday[r.matchday] = getMatchdayStatus(games);
        }

        const matchdays = [];
        for (let md = 1; md <= 38; md++) {
            const firstMatch = firstMatchByMatchday[md];
            if (!firstMatch) continue;

            const deadline = new Date(firstMatch.date);
            deadline.setMinutes(deadline.getMinutes() - 5);

            const status = resultByMatchday[md] || { complete: false, confirmedCount: 0, totalMatches: 10 };

            matchdays.push({
                matchday: md,
                deadline: deadline.toISOString(),
                passed: deadline <= now,
                complete: status.complete,
                confirmedCount: status.confirmedCount,
            });
        }

        return {
            statusCode: 200,
            headers: HEADERS,
            body: JSON.stringify({ matchdays }),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            headers: HEADERS,
            body: JSON.stringify({ error: 'Error fetching matchday statuses' }),
        };
    }
};