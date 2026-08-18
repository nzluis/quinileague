import styles from './Navbar.module.css';
import { Link, useLocation } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';

export default function Navbar() {
    const { route, signOut } = useAuthenticator();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    if (route !== 'authenticated') return null;

    return (
        <nav className={styles.navbar}>
            <div className={styles.brand}>
                <Link to="/">
                    <span className={styles.logo}>⚽</span>
                    <span>QuinileaGUE</span>
                </Link>
            </div>
            <ul className={styles.navLinks}>
                <li>
                    <Link to="/apuestas" className={isActive('/apuestas') ? styles.active : ''}>
                        Apuestas
                    </Link>
                </li>
                <li>
                    <Link to="/resultados" className={isActive('/resultados') ? styles.active : ''}>
                        Resultados
                    </Link>
                </li>
                <li>
                    <Link to="/clasificacion" className={isActive('/clasificacion') ? styles.active : ''}>
                        Clasificación
                    </Link>
                </li>
            </ul>
            <div className={styles.actions}>
                <button onClick={signOut} className={styles.signOut}>
                    Salir
                </button>
            </div>
        </nav>
    );
}
