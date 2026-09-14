import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { showError, showSuccess } from '../utils/toast';
import { ADMIN_USERS } from '../utils/constants';
import api from '../utils/api';
import styles from './Admin.module.css';

export default function Admin() {
    const { user } = useAuth();
    const [matchday, setMatchday] = useState(undefined);
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
        if (matchday !== undefined) {
            fetchMatchday(matchday);
        } else {
            api.getNextMatchday().then((res) => {
                setMatchday(res.matchday || 1);
            }).catch(() => {
                setMatchday(1);
            });
        }
    }, [matchday]);

    const fetchMatchday = async (md) => {
        setLoading(true);
        try {
            const [matchesRes, resultsRes] = await Promise.all([
                api.getMatches(md),
                api.getResults(md),
            ]);
            setMatches(matchesRes.matches || []);

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
        const num = value === '' ? null : parseInt(value);
        setResults((prev) => ({
            ...prev,
            [matchId]: { ...prev[matchId], [field]: num },
        }));
    };

    const handleSubmit = async () => {
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
            await api.submitResults(matchday, formattedResults);
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
            <h1>Admin - Introducir Resultados</h1>

            <div className={styles.matchdaySelector}>
                <label>Jornada: </label>
                <input
                    type="number"
                    min="1"
                    max="38"
                    value={matchday}
                    onChange={(e) => setMatchday(parseInt(e.target.value))}
                />
            </div>

            {loading ? (
                <p>Cargando partidos...</p>
            ) : (
                <>
                    <p className={styles.info}>
                        Introduce los resultados de la jornada {matchday}
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
