import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { showError, showSuccess } from '../utils/toast';
import { ADMIN_USERS } from '../utils/constants';
import api from '../utils/api';
import styles from './Admin.module.css';

export default function Admin() {
    const { user } = useAuth();
    const [availableMatchdays, setAvailableMatchdays] = useState([]);
    const [selectedMatchday, setSelectedMatchday] = useState(undefined);
    const [isComplete, setIsComplete] = useState(false);
    const [matches, setMatches] = useState([]);
    const [results, setResults] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    if (!ADMIN_USERS.includes(user.username)) {
        return (
            <div className={styles.container}>
                <p>No tienes permisos de administrador</p>
            </div>
        );
    }

    useEffect(() => {
        api.getMatchdayStatuses().then((data) => {
            const passed = (data.matchdays || []).filter((md) => md.passed);
            setAvailableMatchdays(passed);

            const firstIncomplete = passed.find((md) => !md.complete);
            setSelectedMatchday(firstIncomplete?.matchday ?? passed[0]?.matchday ?? null);
        }).catch(() => {
            api.getNextMatchday().then((res) => {
                setSelectedMatchday(res.matchday || 1);
            }).catch(() => {
                setSelectedMatchday(1);
            });
        });
    }, []);

    useEffect(() => {
        if (selectedMatchday !== undefined && selectedMatchday !== null) {
            fetchMatchday(selectedMatchday);
        }
    }, [selectedMatchday]);

    const fetchMatchday = async (md) => {
        setLoading(true);
        setIsComplete(false);
        try {
            const [matchesRes, resultsRes] = await Promise.all([
                api.getMatches(md),
                api.getResults(md),
            ]);
            setMatches(matchesRes.matches || []);
            setIsComplete(resultsRes.complete || false);

            const existingResults = {};
            for (const match of matchesRes.matches || []) {
                if (resultsRes.games?.[match.matchId]) {
                    const [home, away] = resultsRes.games[match.matchId].score.split('-');
                    existingResults[match.matchId] = { home: parseInt(home), away: parseInt(away) };
                } else {
                    existingResults[match.matchId] = { home: null, away: null };
                }
            }
            setResults(existingResults);
        } catch (error) {
            console.error(error);
            showError('Error cargando datos');
        } finally {
            setLoading(false);
        }
    };

    const handleScoreChange = (matchId, field, value) => {
        if (isComplete) return;
        const num = value === '' ? null : parseInt(value);
        setResults((prev) => ({
            ...prev,
            [matchId]: { ...prev[matchId], [field]: num },
        }));
    };

    const handleSubmit = async () => {
        if (isComplete) return;

        const matchesWithResults = matches.filter((m) => {
            const r = results[m.matchId];
            return r && r.home !== null && r.away !== null;
        });

        if (matchesWithResults.length === 0) {
            showError('Introduce al menos un resultado');
            return;
        }

        setSubmitting(true);
        try {
            const formattedResults = matchesWithResults.map((m) => {
                const r = results[m.matchId];
                return {
                    matchId: m.matchId,
                    homeScore: r.home,
                    awayScore: r.away,
                };
            });
            await api.submitResults(selectedMatchday, formattedResults);
            showSuccess(`${formattedResults.length} resultado(s) guardado(s)`);
        } catch (error) {
            showError(error.message || 'Error guardando resultados');
        } finally {
            setSubmitting(false);
        }
    };

    const confirmedCount = matches.filter((m) => {
        const r = results[m.matchId];
        return r && r.home !== null && r.away !== null;
    }).length;

    const hasAnyScore = confirmedCount > 0;

    return (
        <div className={styles.container}>
            {availableMatchdays.length > 0 && (
                <div className={styles.indexBar}>
                    {availableMatchdays.map((md) => (
                        <button
                            key={md.matchday}
                            className={`${styles.indexBtn} ${md.matchday === selectedMatchday ? styles.indexBtnActive : ''} ${md.complete ? styles.indexBtnComplete : ''}`}
                            onClick={() => setSelectedMatchday(md.matchday)}
                        >
                            {md.matchday}
                        </button>
                    ))}
                </div>
            )}

            {loading ? (
                <p className={styles.info}>Cargando partidos...</p>
            ) : isComplete ? (
                <>
                    <p className={styles.info}>
                        Jornada {selectedMatchday} - Todos los resultados confirmados
                    </p>

                    <div className={styles.matches}>
                        {matches.map((match) => {
                            const r = results[match.matchId];
                            return (
                                <div key={match.matchId} className={`${styles.matchCard} ${styles.matchLocked}`}>
                                    <div className={styles.matchDate}>
                                        {new Date(match.date).toLocaleDateString('es-ES', {
                                            weekday: 'short',
                                            day: 'numeric',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </div>
                                    <div className={styles.matchTeams}>
                                        <span className={styles.team}>{match.homeTeam}</span>
                                        <span className={styles.versus}>vs</span>
                                        <span className={styles.team}>{match.awayTeam}</span>
                                    </div>
                                    <div className={styles.scoreInputs}>
                                        <input
                                            type="number"
                                            min="0"
                                            className={styles.scoreInput}
                                            value={r?.home ?? ''}
                                            readOnly
                                        />
                                        <span className={styles.scoreSeparator}>-</span>
                                        <input
                                            type="number"
                                            min="0"
                                            className={styles.scoreInput}
                                            value={r?.away ?? ''}
                                            readOnly
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            ) : (
                <>
                    <p className={styles.info}>
                        Jornada {selectedMatchday}
                        {confirmedCount > 0 && confirmedCount < 10 && (
                            <span className={styles.partialInfo}> ({confirmedCount}/10 confirmados)</span>
                        )}
                    </p>

                    <div className={styles.matches}>
                        {matches.map((match) => {
                            const r = results[match.matchId];
                            const isConfirmed = r && r.home !== null && r.away !== null;
                            return (
                                <div
                                    key={match.matchId}
                                    className={`${styles.matchCard} ${isConfirmed ? styles.matchConfirmed : ''}`}
                                >
                                    <div className={styles.matchDate}>
                                        {new Date(match.date).toLocaleDateString('es-ES', {
                                            weekday: 'short',
                                            day: 'numeric',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </div>
                                    <div className={styles.matchTeams}>
                                        <span className={styles.team}>{match.homeTeam}</span>
                                        <span className={styles.versus}>vs</span>
                                        <span className={styles.team}>{match.awayTeam}</span>
                                    </div>
                                    <div className={styles.scoreInputs}>
                                        <input
                                            type="number"
                                            min="0"
                                            className={styles.scoreInput}
                                            value={r?.home ?? ''}
                                            onChange={(e) => handleScoreChange(match.matchId, 'home', e.target.value)}
                                        />
                                        <span className={styles.scoreSeparator}>-</span>
                                        <input
                                            type="number"
                                            min="0"
                                            className={styles.scoreInput}
                                            value={r?.away ?? ''}
                                            onChange={(e) => handleScoreChange(match.matchId, 'away', e.target.value)}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !hasAnyScore}
                        className={styles.submitBtn}
                    >
                        {submitting
                            ? 'Guardando...'
                            : confirmedCount < 10
                                ? `Guardar parcial (${confirmedCount}/10)`
                                : 'Guardar todos los resultados'}
                    </button>
                </>
            )}
        </div>
    );
}
