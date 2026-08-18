import { useState, useEffect } from 'react';
import Spinner from '../components/Spinner/Spinner';
import api from '../utils/api';
import styles from './Resultados.module.css';

export default function Resultados() {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchResults();
    }, []);

    const fetchResults = async () => {
        try {
            const data = await api.getResults();
            setResults(data.results || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Spinner />;

    return (
        <div className={styles.container}>
            <h1>Resultados</h1>
            {results.length === 0 ? (
                <p className={styles.empty}>No hay resultados disponibles</p>
            ) : (
                results.map((result) => (
                    <div key={result.matchday} className={styles.matchday}>
                        <h2>Jornada {result.matchday}</h2>
                        <div className={styles.matches}>
                            {result.matches.map((match) => (
                                <div key={match.matchId} className={styles.match}>
                                    <span>{match.homeTeam}</span>
                                    <span className={styles.score}>
                                        {match.homeScore} - {match.awayScore}
                                    </span>
                                    <span>{match.awayTeam}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
