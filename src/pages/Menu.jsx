import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import styles from './Menu.module.css';

export default function Menu() {
    const { user } = useAuth();

    if (user) return <Navigate to="/apuestas" replace />;

    return (
        <div className={styles.container}>
            <div className={styles.hero}>
                <h1 className={styles.title}>quiniLEAGUE</h1>
                <p className={styles.subtitle}>La Liga 2026/27</p>
                <p className={styles.description}>
                    Apuesta por los resultados de cada jornada y compite con tus amigos
                </p>
                <div className={styles.features}>
                    <div className={styles.feature}>
                        <span className={styles.icon}>📅</span>
                        <span>38 jornadas</span>
                    </div>
                    <div className={styles.feature}>
                        <span className={styles.icon}>⚽</span>
                        <span>10 partidos por jornada</span>
                    </div>
                    <div className={styles.feature}>
                        <span className={styles.icon}>🏆</span>
                        <span>Clasificación en tiempo real</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
