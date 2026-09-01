import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar/Navbar';
import Menu from './pages/Menu';
import Login from './pages/Login';
import Apuestas from './pages/Apuestas';
import Clasificacion from './pages/Clasificacion';
import Resultados from './pages/Resultados';
import Admin from './pages/Admin';
import Check from './pages/Check';
import Spinner from './components/Spinner/Spinner';
import layoutStyles from './Layout.module.css';

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <Spinner />;
    if (!user) return <Navigate to="/" replace />;
    return children;
}

function Shell() {
    const { user, loading } = useAuth();

    if (loading) return <Spinner height="100vh" />;
    if (!user) return <Login />;

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
                    <Route
                        path="/admin/check"
                        element={
                            <ProtectedRoute>
                                <Check />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </main>
            <Toaster />
        </>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <Shell />
        </BrowserRouter>
    );
}
