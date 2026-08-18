import { describe, test, expect } from 'vitest';
import {
    calculateDeadline,
    isDeadlinePassed,
    calculatePoints,
    determineActualResult,
    validateBet,
} from './betLogic.js';

describe('Deadline Calculation', () => {
    test('calculateDeadline returns 1 hour before first match', () => {
        const firstMatch = '2026-09-01T21:00:00Z';
        const deadline = calculateDeadline(firstMatch);

        expect(deadline.toISOString()).toBe('2026-09-01T20:00:00.000Z');
    });

    test('calculateDeadline returns null for null input', () => {
        expect(calculateDeadline(null)).toBeNull();
    });

    test('calculateDeadline returns null for undefined input', () => {
        expect(calculateDeadline(undefined)).toBeNull();
    });

    test('isDeadlinePassed returns true when current time is after deadline', () => {
        const pastDeadline = '2020-01-01T00:00:00Z';
        expect(isDeadlinePassed(pastDeadline)).toBe(true);
    });

    test('isDeadlinePassed returns false when current time is before deadline', () => {
        const futureDeadline = '2099-12-31T23:59:59Z';
        expect(isDeadlinePassed(futureDeadline)).toBe(false);
    });

    test('isDeadlinePassed returns true for null deadline', () => {
        expect(isDeadlinePassed(null)).toBe(true);
    });
});

describe('Points Calculation', () => {
    test('returns 3 points for correct 1 prediction (home win)', () => {
        expect(calculatePoints('1', 2, 1)).toBe(3);
    });

    test('returns 3 points for correct X prediction (draw)', () => {
        expect(calculatePoints('X', 1, 1)).toBe(3);
    });

    test('returns 3 points for correct 2 prediction (away win)', () => {
        expect(calculatePoints('2', 0, 2)).toBe(3);
    });

    test('returns 0 points for incorrect 1 prediction (away win)', () => {
        expect(calculatePoints('1', 0, 2)).toBe(0);
    });

    test('returns 0 points for incorrect X prediction (home win)', () => {
        expect(calculatePoints('X', 2, 1)).toBe(0);
    });

    test('returns 0 points for incorrect 2 prediction (draw)', () => {
        expect(calculatePoints('2', 1, 1)).toBe(0);
    });

    test('returns 0 points when scores are null', () => {
        expect(calculatePoints('1', null, null)).toBe(0);
        expect(calculatePoints('X', null, null)).toBe(0);
        expect(calculatePoints('2', null, null)).toBe(0);
    });
});

describe('Actual Result Determination', () => {
    test('returns 1 for home win', () => {
        expect(determineActualResult(2, 0)).toBe('1');
        expect(determineActualResult(1, 0)).toBe('1');
    });

    test('returns X for draw', () => {
        expect(determineActualResult(0, 0)).toBe('X');
        expect(determineActualResult(1, 1)).toBe('X');
        expect(determineActualResult(3, 3)).toBe('X');
    });

    test('returns 2 for away win', () => {
        expect(determineActualResult(0, 2)).toBe('2');
        expect(determineActualResult(1, 3)).toBe('2');
    });

    test('returns null for null scores', () => {
        expect(determineActualResult(null, null)).toBeNull();
        expect(determineActualResult(1, null)).toBeNull();
        expect(determineActualResult(null, 1)).toBeNull();
    });
});

describe('Bet Validation', () => {
    const matches = [
        { matchId: 'j1_m1', homeTeam: 'Alavés', awayTeam: 'Getafe' },
        { matchId: 'j1_m2', homeTeam: 'Sevilla', awayTeam: 'Rayo Vallecano' },
    ];

    test('returns no errors for valid bets', () => {
        const bets = [
            { matchId: 'j1_m1', prediction: '1' },
            { matchId: 'j1_m2', prediction: 'X' },
        ];
        expect(validateBet(bets, matches)).toEqual([]);
    });

    test('returns error for empty bets', () => {
        expect(validateBet([], matches)).toContain('No bets provided');
    });

    test('returns error for null bets', () => {
        expect(validateBet(null, matches)).toContain('No bets provided');
    });

    test('returns error for unknown match', () => {
        const bets = [{ matchId: 'j99_m1', prediction: '1' }];
        const errors = validateBet(bets, matches);
        expect(errors).toContain('Match j99_m1 not found');
    });

    test('returns error for invalid prediction', () => {
        const bets = [
            { matchId: 'j1_m1', prediction: 'invalid' },
            { matchId: 'j1_m2', prediction: '3' },
        ];
        const errors = validateBet(bets, matches);
        expect(errors).toContain('Invalid prediction invalid for match j1_m1');
        expect(errors).toContain('Invalid prediction 3 for match j1_m2');
    });

    test('accepts valid predictions 1, X, 2', () => {
        const bets = [
            { matchId: 'j1_m1', prediction: '1' },
            { matchId: 'j1_m2', prediction: 'X' },
        ];
        expect(validateBet(bets, matches)).toEqual([]);
    });
});
