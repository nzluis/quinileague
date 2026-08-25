import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { showError, showSuccess } from '../utils/toast';
import api from '../utils/api';
import styles from './Admin.module.css';

const ADMIN_USERS = ['aguakiko@gmail.com', '61d900fe-30e1-70c5-2e71-bcd4b4eb8336'];

export default function Admin() {
    const { user } = useAuth();
    const [matchday, setMatchday] = useState(1);
    const [results, setResults] = useState({});
    const [submitting, setSubmitting] = useState(false);

    if (!ADMIN_USERS.includes(user.username)) {
        return (
            <div className={styles.container}>
                <p>No tienes permisos de administrador</p>
            </div>
        );
    }

    const handleResultChange = (matchId, field, value) => {
        setResults((prev) => ({
            ...prev,
            [matchId]: { ...prev[matchId], [field]: parseInt(value) || 0 },
        }));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const formattedResults = Object.entries(results).map(([matchId, score]) => ({
                matchId,
                homeScore: score.home,
                awayScore: score.away,
            }));
            await api.submitResults(matchday, formattedResults);
            showSuccess('Resultados guardados');
            setResults({});
        } catch (error) {
            showError(error.message || 'Error guardando resultados');
        } finally {
            setSubmitting(false);
        }
    };

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
            <p className={styles.info}>
                Introduce los resultados de cada partido de la jornada {matchday}
            </p>
            <button onClick={handleSubmit} disabled={submitting} className={styles.submitBtn}>
                {submitting ? 'Guardando...' : 'Guardar Resultados'}
            </button>
        </div>
    );
}
