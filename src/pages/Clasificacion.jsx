import { useState, useEffect } from 'react';
import Spinner from '../components/Spinner/Spinner';
import api from '../utils/api';
import { USER_NAMES } from '../utils/constants';
import styles from './Clasificacion.module.css';

function getDisplayName(userId) {
    return USER_NAMES[userId] || userId;
}

function getRank(index, standings) {
    if (index === 0) return 1;
    const current = standings[index];
    const previous = standings[index - 1];
    if (current.points === previous.points) {
        return getRank(index - 1, standings);
    }
    return index + 1;
}

export default function Clasificacion() {
    const [standings, setStandings] = useState([]);
    const [standingsComplete, setStandingsComplete] = useState([]);
    const [provisionalMatchdays, setProvisionalMatchdays] = useState([]);
    const [allResults, setAllResults] = useState([]);
    const [viewMode, setViewMode] = useState('complete');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStandings();
    }, []);

    const fetchStandings = async () => {
        try {
            const [standingsData, resultsData] = await Promise.all([
                api.getStandings(),
                api.getResults(),
            ]);
            setStandings(standingsData.standings || []);
            setStandingsComplete(standingsData.standingsComplete || []);
            setProvisionalMatchdays(standingsData.provisionalMatchdays || []);
            setAllResults(resultsData.results || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Spinner />;

    const hasProvisional = provisionalMatchdays.length > 0;
    const currentStandings = viewMode === 'provisional' ? standings : standingsComplete;

    const sortedProvisional = [...provisionalMatchdays].sort((a, b) => a - b);
    const lastCompleteMatchday = allResults
        .filter((r) => r.complete)
        .sort((a, b) => b.matchday - a.matchday)[0]?.matchday;

    return (
        <div className={styles.container}>
            <div className={styles.tabsRow}>
                <button
                    className={`${styles.tab} ${styles.tabGreen} ${(!hasProvisional || viewMode === 'complete') ? styles.tabActive : ''}`}
                    onClick={() => setViewMode('complete')}
                >
                    Clasificación
                </button>
                {hasProvisional && (
                    <button
                        className={`${styles.tab} ${styles.tabYellow} ${viewMode === 'provisional' ? styles.tabActive : ''}`}
                        onClick={() => setViewMode('provisional')}
                    >
                        ⏳ En juego
                    </button>
                )}
            </div>

            {viewMode === 'provisional' && hasProvisional && (
                <div className={styles.warningBanner}>
                    {sortedProvisional.length === 1
                        ? `Provisional - Jornada ${sortedProvisional[0]}`
                        : `Provisional - ${sortedProvisional.length} jornadas en marcha`}
                </div>
            )}

            {viewMode === 'complete' && lastCompleteMatchday && (
                <div className={styles.infoBanner}>
                    Después de Jornada {lastCompleteMatchday}
                </div>
            )}

            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Usuario</th>
                        <th>🏆</th>
                        <th>🎯</th>
                        <th>💀</th>
                    </tr>
                </thead>
                <tbody>
                    {currentStandings.map((entry, index) => (
                        <tr key={entry.userId}>
                            <td>{getRank(index, currentStandings)}</td>
                            <td>{getDisplayName(entry.userId)}</td>
                            <td>{entry.points}</td>
                            <td>{entry.correct}</td>
                            <td>{entry.zeros}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
