import { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import MatchCard from '../components/MatchCard/MatchCard';
import Spinner from '../components/Spinner/Spinner';
import toast from 'react-hot-toast';
import api from '../utils/api';
import styles from './Apuestas.module.css';

const TOTAL_MATCHDAYS = 38;

export default function Apuestas() {
    const { user } = useAuthenticator();
    const [selectedMatchday, setSelectedMatchday] = useState(1);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [matches, setMatches] = useState([]);
    const [bets, setBets] = useState({});
    const [deadline, setDeadline] = useState(null);
    const [firstMatchDate, setFirstMatchDate] = useState(null);

    const isLocked = deadline && new Date() > new Date(deadline);
    const hasUserBet = Object.keys(bets).length > 0;

    useEffect(() => {
        fetchMatchday(selectedMatchday);
    }, [selectedMatchday]);

    const fetchMatchday = async (matchday) => {
        setLoading(true);
        try {
            const [matchesRes, betsRes, nextRes] = await Promise.all([
                api.getMatches(matchday),
                api.getBets(matchday),
                api.getNextMatchday(matchday),
            ]);

            setMatches(matchesRes.matches || []);
            setDeadline(nextRes.deadline || null);
            setFirstMatchDate(nextRes.firstMatchDate || null);

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
        if (isLocked) {
            toast.error('El plazo ha expirado');
            return;
        }

        setSubmitting(true);
        try {
            await api.submitBet({
                matchday: selectedMatchday,
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

    return (
        <div className={styles.container}>
            <div className={styles.indexBar}>
                {Array.from({ length: TOTAL_MATCHDAYS }, (_, i) => i + 1).map((n) => (
                    <button
                        key={n}
                        className={`${styles.indexBtn} ${n === selectedMatchday ? styles.indexBtnActive : ''}`}
                        onClick={() => setSelectedMatchday(n)}
                    >
                        {n}
                    </button>
                ))}
            </div>

            {loading ? (
                <Spinner height="50vh" />
            ) : (
                <>
                    <div className={styles.contentHeader}>
                        <h1>Jornada {selectedMatchday}</h1>
                        {deadline && (
                            <p className={styles.deadline}>
                                {isLocked ? 'Plazo cerrado' : `Plazo: ${new Date(deadline).toLocaleString('es-ES')}`}
                            </p>
                        )}
                    </div>

                    <div className={styles.matches}>
                        {matches.map((match) => (
                            <MatchCard
                                key={match.matchId}
                                match={match}
                                prediction={bets[match.matchId]}
                                onPredictionChange={(pred) => handlePrediction(match.matchId, pred)}
                                disabled={isLocked}
                                readOnly={isLocked}
                            />
                        ))}
                    </div>

                    {isLocked ? (
                        !hasUserBet && (
                            <div className={styles.noBetMsg}>
                                Apuesta no realizada
                            </div>
                        )
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || Object.keys(bets).length === 0}
                            className={styles.submitBtn}
                        >
                            {submitting ? 'Guardando...' : 'Guardar Apuestas'}
                        </button>
                    )}
                </>
            )}
        </div>
    );
}
