import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { showError, showSuccess } from '../utils/toast';
import { ADMIN_USERS } from '../utils/constants';
import api from '../utils/api';
import styles from './Admin.module.css';

export default function Admin() {
    const { user } = useAuth();
    const [matchday, setMatchday] = useState(1);
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
        fetchMatchday(matchday);
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
            if (resultsRes.games) {
                Object.entries(resultsRes.games).forEach(([matchId, game]) => {
                    const [home, away] = game.score.split('-');
                    existingResults[matchId] = { home: parseInt(home), away: parseInt(away) };
                });
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
        const num = parseInt(value) || 0;
        setResults((prev) => ({
            ...prev,
            [matchId]: { ...prev[matchId], [field]: num },
        }));
    };

    const handleSubmit = async () => {
        const matchesWithResults = matches.filter((m) => {
            const r = results[m.matchId];
            return r && (r.home >= 0 || r.away >= 0);
        });

        if (matchesWithResults.length !== matches.length) {
            showError('Introduce el resultado de todos los partidos');
            return;
        }

        setSubmitting(true);
        try {
            const formattedResults = matches.map((m) => {
                const r = results[m.matchId];
                return {
                    matchId: m.matchId,
                    homeScore: r.home,
                    awayScore: r.away,
                };
            });
            await api.submitResults(matchday, formattedResults);
            showSuccess('Resultados guardados');
        } catch (error) {
            showError(error.message || 'Error guardando resultados');
        } finally {
            setSubmitting(false);
        }
    };

    const allScoresEntered = matches.length > 0 && matches.every((m) => {
        const r = results[m.matchId];
        return r && (r.home >= 0 || r.away >= 0);
    });

    const hasAnyScore = matches.some((m) => {
        const r = results[m.matchId];
        return r && (r.home > 0 || r.away > 0);
    });

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
                        Introduce los resultados de cada partido de la jornada {matchday}
                    </p>

                    <div className={styles.matches}>
                        {matches.map((match) => (
                            <div key={match.matchId} className={styles.matchCard}>
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
                                        value={results[match.matchId]?.home ?? ''}
                                        onChange={(e) => handleScoreChange(match.matchId, 'home', e.target.value)}
                                        placeholder="0"
                                    />
                                    <span className={styles.scoreSeparator}>-</span>
                                    <input
                                        type="number"
                                        min="0"
                                        className={styles.scoreInput}
                                        value={results[match.matchId]?.away ?? ''}
                                        onChange={(e) => handleScoreChange(match.matchId, 'away', e.target.value)}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !allScoresEntered || !hasAnyScore}
                        className={styles.submitBtn}
                    >
                        {submitting ? 'Guardando...' : 'Guardar Resultados'}
                    </button>
                </>
            )}
        </div>
    );
}
