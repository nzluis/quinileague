import { useState, useEffect } from 'react';
import Spinner from '../components/Spinner/Spinner';
import api from '../utils/api';
import { USER_NAMES } from '../utils/constants';
import styles from './Resultados.module.css';

const PREDICTION_LABELS = { '1': '1', 'X': 'X', '2': '2' };

function getDisplayName(userId) {
    return USER_NAMES[userId] || userId;
}

export default function Resultados() {
    const [availableMatchdays, setAvailableMatchdays] = useState([]);
    const [selectedMatchday, setSelectedMatchday] = useState(undefined);
    const [matchdayData, setMatchdayData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getResults().then((data) => {
            const available = (data.results || []).sort((a, b) => a.matchday - b.matchday);
            setAvailableMatchdays(available.map((r) => r.matchday));
            const firstIncomplete = available.find((r) => !r.complete);
            setSelectedMatchday(firstIncomplete?.matchday ?? available[0]?.matchday ?? null);
        }).catch(() => {}).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (selectedMatchday === undefined || selectedMatchday === null) return;
        setLoading(true);
        api.getResults(selectedMatchday).then((data) => {
            setMatchdayData(data);
        }).catch(() => {}).finally(() => setLoading(false));
    }, [selectedMatchday]);

    if (loading && !matchdayData) return <Spinner height="50vh" />;

    const hasMatchdays = availableMatchdays.length > 0;

    return (
        <div className={styles.container}>
            <div className={styles.indexBar}>
                {hasMatchdays && availableMatchdays.map((n) => (
                    <button
                        key={n}
                        className={`${styles.indexBtn} ${n === selectedMatchday ? styles.indexBtnActive : ''}`}
                        onClick={() => setSelectedMatchday(n)}
                    >
                        {n}
                    </button>
                ))}
            </div>

            {!hasMatchdays ? (
                <p className={styles.empty}>No hay resultados aún</p>
            ) : loading ? (
                <Spinner height="40vh" />
            ) : matchdayData?.matches?.length > 0 ? (
                <>
                    <div className={styles.summarySection}>
                        <h2 className={styles.sectionTitle}>Jornada {selectedMatchday}</h2>
                        {matchdayData.complete === false && (
                            <div className={styles.warningBanner}>
                                Provisional - {matchdayData.confirmedCount}/{matchdayData.totalMatches}
                            </div>
                        )}
                        <div className={styles.summaryTable}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Usuario</th>
                                        <th>Puntos</th>
                                        <th>Aciertos</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(matchdayData.summary || {})
                                        .sort(([, a], [, b]) => {
                                            if (a.noBet && !b.noBet) return 1;
                                            if (!a.noBet && b.noBet) return -1;
                                            return b.points - a.points;
                                        })
                                        .map(([userId, data]) => (
                                            <tr key={userId} className={data.noBet ? styles.noBetRow : ''}>
                                                <td className={styles.userName}>{getDisplayName(userId)}</td>
                                                <td className={styles.points}>{data.noBet ? '-' : data.points}</td>
                                                <td className={styles.correct}>{data.noBet ? '-' : data.correct}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className={styles.matches}>
                        {matchdayData.matches.map((match) => (
                            <div key={match.matchId} className={styles.matchCard}>
                                <div className={styles.matchHeader}>
                                    <span className={styles.date}>
                                        {new Date(match.date).toLocaleDateString('es-ES', {
                                            weekday: 'short', day: 'numeric', month: 'short',
                                        })}
                                    </span>
                                    <div className={styles.matchInfo}>
                                        <span className={styles.team}>{match.homeTeam}</span>
                                        <span className={styles.score}>
                                            {match.score || '?'}
                                        </span>
                                        <span className={styles.team}>{match.awayTeam}</span>
                                    </div>
                                    <span className={`${styles.resultBadge} ${styles[`result${match.result}`]}`}>
                                        {match.result}
                                    </span>
                                </div>

                                <div className={styles.betsTable}>
                                    {(matchdayData.users || [])
                                        .slice()
                                        .sort((a, b) => {
                                            const correctA = Object.values(a.bets || {}).filter((bet) => bet.correct).length;
                                            const correctB = Object.values(b.bets || {}).filter((bet) => bet.correct).length;
                                            return correctB - correctA;
                                        })
                                        .map((user) => {
                                            const bet = user.bets?.[match.matchId];
                                            if (!bet) return null;
                                            return (
                                                <div
                                                    key={user.userId}
                                                    className={`${styles.betRow} ${bet.correct ? styles.betCorrect : styles.betWrong}`}
                                                >
                                                    <span className={styles.betUser}>{getDisplayName(user.userId)}</span>
                                                    <span className={styles.betPred}>{PREDICTION_LABELS[bet.prediction] || bet.prediction}</span>
                                                    <span className={styles.betStatus}>
                                                        {bet.correct ? '✓' : '✗'}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <p className={styles.empty}>No hay resultados para esta jornada</p>
            )}
        </div>
    );
}
