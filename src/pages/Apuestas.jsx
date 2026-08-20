import { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import MatchCard from '../components/MatchCard/MatchCard';
import Spinner from '../components/Spinner/Spinner';
import toast from 'react-hot-toast';
import api from '../utils/api';
import styles from './Apuestas.module.css';

export default function Apuestas() {
    const { user } = useAuthenticator();
    const [matchday, setMatchday] = useState(1);
    const [matches, setMatches] = useState([]);
    const [bets, setBets] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [deadline, setDeadline] = useState(null);

    useEffect(() => {
        fetchData();
    }, [matchday]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [matchesRes, betsRes, nextRes] = await Promise.all([
                api.getMatches(matchday),
                api.getBets(matchday),
                api.getNextMatchday(matchday),
            ]);

            setMatches(matchesRes.matches || []);
            setDeadline(nextRes.deadline || null);

            const userBets = {};
            (betsRes.bets || []).forEach((bet) => {
                if (bet.userId === user.username) {
                    userBets[bet.matchId] = bet.prediction;
                }
            });
            setBets(userBets);
        } catch (error) {
            console.error(error);
            toast.error('Error cargando datos');
        } finally {
            setLoading(false);
        }
    };

    const handlePrediction = (matchId, prediction) => {
        setBets((prev) => ({ ...prev, [matchId]: prediction }));
    };

    const handleSubmit = async () => {
        if (deadline && new Date() > new Date(deadline)) {
            toast.error('El plazo ha expirado');
            return;
        }

        setSubmitting(true);
        try {
            await api.submitBet({
                matchday,
                userId: user.username,
                bets: Object.entries(bets).map(([matchId, prediction]) => ({
                    matchId,
                    prediction,
                })),
            });
            toast.success('Apuestas guardadas');
        } catch (error) {
            toast.error('Error guardando apuestas');
        } finally {
            setSubmitting(false);
        }
    };

    const isLocked = deadline && new Date() > new Date(deadline);

    if (loading) return <Spinner />;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Jornada {matchday}</h1>
                {deadline && (
                    <p className={styles.deadline}>
                        Plazo: {new Date(deadline).toLocaleString('es-ES')}
                    </p>
                )}
            </div>

            <div className={styles.matchdaySelector}>
                <button onClick={() => setMatchday((m) => Math.max(1, m - 1))}>←</button>
                <span>Jornada {matchday}</span>
                <button onClick={() => setMatchday((m) => Math.min(38, m + 1))}>→</button>
            </div>

            <div className={styles.matches}>
                {matches.map((match) => (
                    <MatchCard
                        key={match.matchId}
                        match={match}
                        prediction={bets[match.matchId]}
                        onPredictionChange={(pred) => handlePrediction(match.matchId, pred)}
                        disabled={isLocked}
                    />
                ))}
            </div>

            {!isLocked && Object.keys(bets).length > 0 && (
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className={styles.submitBtn}
                >
                    {submitting ? 'Guardando...' : 'Guardar Apuestas'}
                </button>
            )}
        </div>
    );
}
