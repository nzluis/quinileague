import { useState } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import styles from './Admin.module.css';

const ADMIN_USERS = ['luis', 'admin'];

export default function Admin() {
    const { user } = useAuthenticator();
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
            toast.success('Resultados guardados');
            setResults({});
        } catch (error) {
            toast.error('Error guardando resultados');
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
