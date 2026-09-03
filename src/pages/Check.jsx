import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { showError } from '../utils/toast';
import { ADMIN_USERS, USER_NAMES } from '../utils/constants';
import api from '../utils/api';
import styles from './Check.module.css';

export default function Check() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    if (!ADMIN_USERS.includes(user.username)) {
        return (
            <div className={styles.container}>
                <p>No tienes permisos de administrador</p>
            </div>
        );
    }

    const handleCheck = async () => {
        setLoading(true);
        setResult(null);
        try {
            const data = await api.getMissingBets();
            setResult(data);
        } catch (error) {
            console.error(error);
            showError('Error al comprobar apuestas');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <h1>Check - Usuarios sin apostar</h1>

            <button
                onClick={handleCheck}
                disabled={loading}
                className={styles.checkBtn}
            >
                {loading ? 'Comprobando...' : 'Check'}
            </button>

            {result && (
                <div className={styles.result}>
                    {result.matchdays.length === 0 ? (
                        <p className={styles.noMatchdays}>
                            No hay jornadas con deadline próximo
                        </p>
                    ) : (
                        <>
                            <p className={styles.nearestDate}>
                                {result.deadlineDates.length} deadline{result.deadlineDates.length > 1 ? 's' : ''} próximo{result.deadlineDates.length > 1 ? 's' : ''} (próximos 10 días)
                            </p>

                            {result.matchdays.map((md) => (
                                <div key={md.matchday} className={styles.matchdayCard}>
                                    <h2>Jornada {md.matchday}</h2>
                                    <p className={styles.deadline}>
                                        Deadline:{' '}
                                        {new Date(md.deadline).toLocaleString('es-ES', {
                                            day: 'numeric',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>

                                    {md.missingUsers.length === 0 ? (
                                        <p className={styles.allBet}>Todos han apostado</p>
                                    ) : (
                                        <ul className={styles.userList}>
                                            {md.missingUsers.map((uid) => (
                                                <li key={uid}>
                                                    {USER_NAMES[uid] || uid}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}