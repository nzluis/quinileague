import { useState } from 'react';
import { signIn, resetPassword, confirmResetPassword } from 'aws-amplify/auth';
import styles from './Login.module.css';

const ERROR_MESSAGES = {
    NotAuthorizedException: 'Usuario o contraseña incorrectos',
    UserNotFoundException: 'Usuario no encontrado',
    CodeMismatchException: 'El código no es válido',
    ExpiredCodeException: 'El código ha caducado, solicita uno nuevo',
    LimitExceededException: 'Demasiados intentos. Prueba de nuevo más tarde',
};

function errorMessage(err) {
    return ERROR_MESSAGES[err?.name] || 'Ha ocurrido un error. Inténtalo de nuevo';
}

export default function Login() {
    const [view, setView] = useState('signIn'); // 'signIn' | 'forgot' | 'reset'
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [loading, setLoading] = useState(false);

    function switchView(next) {
        setView(next);
        setError('');
        setNotice('');
    }

    async function handleSignIn(e) {
        e.preventDefault();
        setError('');
        setNotice('');
        setLoading(true);
        try {
            await signIn({ username: username.trim(), password });
            // Authenticator.Provider detecta el evento de sesión y actualiza authStatus
        } catch (err) {
            setError(errorMessage(err));
            setLoading(false);
        }
    }

    async function handleSendCode(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { nextStep } = await resetPassword({ username: username.trim() });
            const destination = nextStep?.codeDeliveryDetails?.destination;
            setNotice(
                destination
                    ? `Hemos enviado un código a ${destination}`
                    : 'Hemos enviado un código a tu correo'
            );
            setView('reset');
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setLoading(false);
        }
    }

    async function handleReset(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await confirmResetPassword({
                username: username.trim(),
                confirmationCode: code.trim(),
                newPassword,
            });
            setPassword('');
            setCode('');
            setNewPassword('');
            switchView('signIn');
            setNotice('Contraseña actualizada. Ya puedes entrar.');
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <div className={styles.brand}>
                    <span className={styles.logo}>⚽</span>
                    <h1 className={styles.title}>quiniLEAGUE</h1>
                    <p className={styles.subtitle}>La Liga 2026/27</p>
                </div>

                {view === 'signIn' && (
                    <form onSubmit={handleSignIn} className={styles.form}>
                        <label className={styles.field}>
                            <span className={styles.label}>Usuario</span>
                            <input
                                className={styles.input}
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="username"
                                autoFocus
                                required
                            />
                        </label>
                        <label className={styles.field}>
                            <span className={styles.label}>Contraseña</span>
                            <input
                                className={styles.input}
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                required
                            />
                        </label>

                        {error && <p className={styles.error} role="alert">{error}</p>}
                        {notice && <p className={styles.notice} role="status">{notice}</p>}

                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={loading || !username.trim() || !password}
                        >
                            {loading ? 'Entrando…' : 'Entrar'}
                        </button>
                        <button
                            type="button"
                            className={styles.linkBtn}
                            onClick={() => switchView('forgot')}
                        >
                            ¿Olvidaste tu contraseña?
                        </button>
                    </form>
                )}

                {view === 'forgot' && (
                    <form onSubmit={handleSendCode} className={styles.form}>
                        <p className={styles.helpText}>
                            Introduce tu usuario y te enviaremos un código a tu correo.
                        </p>
                        <label className={styles.field}>
                            <span className={styles.label}>Usuario</span>
                            <input
                                className={styles.input}
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="username"
                                autoFocus
                                required
                            />
                        </label>

                        {error && <p className={styles.error} role="alert">{error}</p>}

                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={loading || !username.trim()}
                        >
                            {loading ? 'Enviando…' : 'Enviar código'}
                        </button>
                        <button
                            type="button"
                            className={styles.linkBtn}
                            onClick={() => switchView('signIn')}
                        >
                            Volver
                        </button>
                    </form>
                )}

                {view === 'reset' && (
                    <form onSubmit={handleReset} className={styles.form}>
                        <label className={styles.field}>
                            <span className={styles.label}>Usuario</span>
                            <input
                                className={styles.input}
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="username"
                                required
                            />
                        </label>
                        <label className={styles.field}>
                            <span className={styles.label}>Código</span>
                            <input
                                className={styles.input}
                                type="text"
                                inputMode="numeric"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                autoFocus
                                required
                            />
                        </label>
                        <label className={styles.field}>
                            <span className={styles.label}>Nueva contraseña</span>
                            <input
                                className={styles.input}
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                autoComplete="new-password"
                                required
                            />
                        </label>

                        {error && <p className={styles.error} role="alert">{error}</p>}
                        {notice && <p className={styles.notice} role="status">{notice}</p>}

                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={loading || !username.trim() || !code.trim() || !newPassword}
                        >
                            {loading ? 'Guardando…' : 'Restablecer contraseña'}
                        </button>
                        <button
                            type="button"
                            className={styles.linkBtn}
                            onClick={() => switchView('signIn')}
                        >
                            Volver
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
