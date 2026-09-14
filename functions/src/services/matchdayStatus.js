const TOTAL_MATCHES_PER_MATCHDAY = 10;

function getMatchdayStatus(games) {
    const entries = games instanceof Map
        ? Array.from(games.entries())
        : Object.entries(games || {});

    const confirmedCount = entries.length;

    return {
        complete: confirmedCount >= TOTAL_MATCHES_PER_MATCHDAY,
        confirmedCount,
        totalMatches: TOTAL_MATCHES_PER_MATCHDAY,
    };
}

module.exports = { getMatchdayStatus, TOTAL_MATCHES_PER_MATCHDAY };
