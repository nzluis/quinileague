import styles from './MatchCard.module.css';

const PREDICTIONS = [
    { value: '1', label: '1' },
    { value: 'X', label: 'X' },
    { value: '2', label: '2' },
];

const PREDICTION_LABELS = {
    '1': 'Victoria local',
    'X': 'Empate',
    '2': 'Victoria visitante',
};

export default function MatchCard({ match, prediction, onPredictionChange, disabled, readOnly }) {
    const isPast = new Date(match.date) < new Date();
    const isLocked = disabled || isPast;

    return (
        <div className={`${styles.card} ${isPast ? styles.past : ''}`}>
            <div className={styles.date}>
                {new Date(match.date).toLocaleDateString('es-ES', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                })}
            </div>
            <div className={styles.match}>
                <span className={styles.team}>{match.homeTeam}</span>
                <span className={styles.versus}>vs</span>
                <span className={styles.team}>{match.awayTeam}</span>
            </div>

            {readOnly ? (
                <div className={styles.readOnlyPrediction}>
                    {prediction ? (
                        <span className={styles.predictionValue}>{prediction}</span>
                    ) : (
                        <span className={styles.predictionEmpty}>—</span>
                    )}
                </div>
            ) : (
                <div className={styles.predictions}>
                    {PREDICTIONS.map((pred) => (
                        <button
                            key={pred.value}
                            type="button"
                            className={`${styles.predBtn} ${prediction === pred.value ? styles.selected : ''}`}
                            onClick={() => onPredictionChange(pred.value)}
                            disabled={isLocked}
                            title={PREDICTION_LABELS[pred.value]}
                        >
                            {pred.label}
                        </button>
                    ))}
                </div>
            )}

            {match.homeScore !== null && (
                <div className={styles.result}>
                    {match.homeScore} - {match.awayScore}
                </div>
            )}
        </div>
    );
}
