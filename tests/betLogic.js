export function calculateDeadline(firstMatchDate) {
    if (!firstMatchDate) return null;
    const deadline = new Date(firstMatchDate);
    deadline.setHours(deadline.getHours() - 1);
    return deadline;
}

export function isDeadlinePassed(deadline) {
    if (!deadline) return true;
    return new Date() > new Date(deadline);
}

export function calculatePoints(prediction, actualHomeScore, actualAwayScore) {
    if (actualHomeScore === null || actualAwayScore === null) return 0;

    let actualResult;
    if (actualHomeScore > actualAwayScore) actualResult = '1';
    else if (actualHomeScore < actualAwayScore) actualResult = '2';
    else actualResult = 'X';

    return prediction === actualResult ? 3 : 0;
}

export function determineActualResult(homeScore, awayScore) {
    if (homeScore === null || awayScore === null) return null;
    if (homeScore > awayScore) return '1';
    if (homeScore < awayScore) return '2';
    return 'X';
}

export function validateBet(bets, matches) {
    const errors = [];

    if (!bets || bets.length === 0) {
        errors.push('No bets provided');
        return errors;
    }

    for (const bet of bets) {
        const match = matches.find(m => m.matchId === bet.matchId);
        if (!match) {
            errors.push(`Match ${bet.matchId} not found`);
            continue;
        }

        if (!['1', 'X', '2'].includes(bet.prediction)) {
            errors.push(`Invalid prediction ${bet.prediction} for match ${bet.matchId}`);
        }
    }

    return errors;
}
