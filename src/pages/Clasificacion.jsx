import { useState, useEffect } from 'react';
import Spinner from '../components/Spinner/Spinner';
import api from '../utils/api';
import styles from './Clasificacion.module.css';

export default function Clasificacion() {
    const [standings, setStandings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStandings();
    }, []);

    const fetchStandings = async () => {
        try {
            const data = await api.getStandings();
            setStandings(data.standings || []);
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
                            <td>{entry.userName}</td>
                            <td>{entry.points}</td>
                            <td>{entry.correct}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
