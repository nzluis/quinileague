import { useAuthenticator } from '@aws-amplify/ui-react';
import styles from './Menu.module.css';

export default function Menu() {
    const { authStatus } = useAuthenticator();

    if (authStatus === 'authenticated') {
        window.location.href = '/apuestas';
        return null;
    }

    return (
        <div className={styles.container}>
            <div className={styles.hero}>
                <h1 className={styles.title}>QuinileaGUE</h1>
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
