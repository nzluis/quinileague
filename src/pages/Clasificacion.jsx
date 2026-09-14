import { useState, useEffect } from 'react';
import Spinner from '../components/Spinner/Spinner';
import api from '../utils/api';
import { USER_NAMES } from '../utils/constants';
import styles from './Clasificacion.module.css';

function getDisplayName(userId) {
    return USER_NAMES[userId] || userId;
}

export default function Clasificacion() {
    const [standings, setStandings] = useState([]);
    const [standingsComplete, setStandingsComplete] = useState([]);
    const [provisionalMatchdays, setProvisionalMatchdays] = useState([]);
    const [viewMode, setViewMode] = useState('complete');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStandings();
    }, []);

    const fetchStandings = async () => {
        try {
            const data = await api.getStandings();
            setStandings(data.standings || []);
            setStandingsComplete(data.standingsComplete || []);
            setProvisionalMatchdays(data.provisionalMatchdays || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Spinner />;

    const hasProvisional = provisionalMatchdays.length > 0;
    const currentStandings = viewMode === 'provisional' ? standings : standingsComplete;

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
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Usuario</th>
                        <th>Puntos</th>
                        <th>Aciertos</th>
                    </tr>
                </thead>
                <tbody>
                    {currentStandings.map((entry, index) => (
                        <tr key={entry.userId}>
                            <td>{index + 1}</td>
                            <td>{getDisplayName(entry.userId)}</td>
                            <td>{entry.points}</td>
                            <td>{entry.correct}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
