import { useState } from 'react';
import styles from './Navbar.module.css';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ADMIN_USERS, FULL_ADMIN_USERS } from '../../utils/constants';

export default function Navbar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [adminOpen, setAdminOpen] = useState(false);

    const isActive = (path) => location.pathname === path;
    const isAdmin = ADMIN_USERS.includes(user?.username);
    const isFullAdmin = FULL_ADMIN_USERS.includes(user?.username);

    if (!user) return null;

    const closeMenu = () => setMenuOpen(false);
    const closeAll = () => {
        setMenuOpen(false);
        setAdminOpen(false);
    };

    return (
        <nav className={styles.navbar}>
            <div className={styles.brand}>
                <Link to="/" onClick={closeAll}>
                    <span className={styles.logo}>⚽</span>
                    <span>quiniLEAGUE</span>
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
                            onClick={closeMenu}
                        >
                            Apuestas
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/resultados"
                            className={isActive('/resultados') ? styles.active : ''}
                            onClick={closeMenu}
                        >
                            Resultados
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/clasificacion"
                            className={isActive('/clasificacion') ? styles.active : ''}
                            onClick={closeMenu}
                        >
                            Clasificación
                        </Link>
                    </li>
                    {isAdmin && (
                        <li className={styles.adminItem}>
                            <button
                                className={`${styles.adminBtn} ${isActive('/admin') || isActive('/admin/check') ? styles.active : ''}`}
                                onClick={() => setAdminOpen((o) => !o)}
                            >
                                Admin
                                <span className={styles.arrow}>{adminOpen ? '▲' : '▼'}</span>
                            </button>
                            <ul className={`${styles.adminDropdown} ${adminOpen ? styles.dropdownOpen : ''}`}>
                                <li>
                                    <Link
                                        to="/admin"
                                        className={isActive('/admin') && !isActive('/admin/check') ? styles.active : ''}
                                        onClick={closeAll}
                                    >
                                        Subir Resultados
                                    </Link>
                                </li>
                                {isFullAdmin && (
                                    <li>
                                        <Link
                                            to="/admin/check"
                                            className={isActive('/admin/check') ? styles.active : ''}
                                            onClick={closeAll}
                                        >
                                            Check
                                        </Link>
                                    </li>
                                )}
                            </ul>
                        </li>
                    )}
                </ul>
                <button onClick={logout} className={styles.signOut}>
                    Salir
                </button>
            </div>

            {menuOpen && (
                <div className={styles.overlay} onClick={closeMenu} />
            )}
        </nav>
    );
}
