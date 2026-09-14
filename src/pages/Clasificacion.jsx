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
    const [provisionalMatchdays, setProvisionalMatchdays] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStandings();
    }, []);

    const fetchStandings = async () => {
        try {
            const data = await api.getStandings();
            setStandings(data.standings || []);
            setProvisionalMatchdays(data.provisionalMatchdays || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Spinner />;

    return (
        <div className={styles.container}>
            <h1>Clasificación</h1>
            {provisionalMatchdays.length > 0 && (
                <div className={styles.warningBanner}>
                    Clasificación provisional. Faltan resultados por confirmar en las jornadas: {provisionalMatchdays.sort((a, b) => a - b).join(', ')}
                </div>
            )}
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
                    {standings.map((entry, index) => (
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
