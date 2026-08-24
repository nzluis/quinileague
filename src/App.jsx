import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import Navbar from './components/Navbar/Navbar';
import Menu from './pages/Menu';
import Login from './pages/Login';
import Apuestas from './pages/Apuestas';
import Clasificacion from './pages/Clasificacion';
import Resultados from './pages/Resultados';
import Admin from './pages/Admin';
import Spinner from './components/Spinner/Spinner';
import layoutStyles from './Layout.module.css';

function ProtectedRoute({ children }) {
    const { authStatus } = useAuthenticator();
    if (authStatus === 'configuring') return <Spinner />;
    if (authStatus !== 'authenticated') return <Navigate to="/" replace />;
    return children;
}

function Shell() {
    const { authStatus } = useAuthenticator();

    if (authStatus === 'unauthenticated') return <Login />;

    return (
        <>
            <Navbar />
            <main className={layoutStyles.main}>
                <Routes>
                    <Route path="/" element={<Menu />} />
                    <Route
                        path="/apuestas"
                        element={
                            <ProtectedRoute>
                                <Apuestas />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/clasificacion"
                        element={
                            <ProtectedRoute>
                                <Clasificacion />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/resultados"
                        element={
                            <ProtectedRoute>
                                <Resultados />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute>
                                <Admin />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </main>
        </>
    );
}

export default function App() {
    const { authStatus } = useAuthenticator();

    if (authStatus === 'configuring') return <Spinner height="100vh" />;

    return (
        <BrowserRouter>
            <Shell />
        </BrowserRouter>
    );
}
