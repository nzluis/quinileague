import { useState } from 'react';
import styles from './Navbar.module.css';
import { Link, useLocation } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';

export default function Navbar() {
    const { route, signOut } = useAuthenticator();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    const isActive = (path) => location.pathname === path;

    if (route !== 'authenticated') return null;

    return (
        <nav className={styles.navbar}>
            <div className={styles.brand}>
                <Link to="/" onClick={() => setMenuOpen(false)}>
                    <span className={styles.logo}>⚽</span>
                    <span>QuinileaGUE</span>
                </Link>
                <button
                    className={styles.hamburger}
                    onClick={() => setMenuOpen((o) => !o)}
                    aria-label="Menú"
                >
                    {menuOpen ? '✕' : '☰'}
                </button>
            </div>

            <div className={`${styles.navLinks} ${menuOpen ? styles.navLinksOpen : ''}`}>
                <ul>
                    <li>
                        <Link
                            to="/apuestas"
                            className={isActive('/apuestas') ? styles.active : ''}
                            onClick={() => setMenuOpen(false)}
                        >
                            Apuestas
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/resultados"
                            className={isActive('/resultados') ? styles.active : ''}
                            onClick={() => setMenuOpen(false)}
                        >
                            Resultados
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/clasificacion"
                            className={isActive('/clasificacion') ? styles.active : ''}
                            onClick={() => setMenuOpen(false)}
                        >
                            Clasificación
                        </Link>
                    </li>
                    <li>
                        <button onClick={signOut} className={styles.signOut}>
                            Salir
                        </button>
                    </li>
                </ul>
            </div>

            {menuOpen && (
                <div className={styles.overlay} onClick={() => setMenuOpen(false)} />
            )}
        </nav>
    );
}
