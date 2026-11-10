import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner/Spinner';
import api from '../utils/api';
import { EVOLUTION_ADMIN_USERS, USER_NAMES } from '../utils/constants';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from 'recharts';
import styles from './Evolucion.module.css';

const PALETTE = [
    '#e6194b', '#3cb44b', '#4363d8', '#f58231', '#911eb4',
    '#42d4f4', '#f032e6', '#9a6324', '#469990', '#800000',
    '#808000', '#000075', '#a9a9a9', '#00bfa5', '#ff6ec7',
];

function getDisplayName(userId) {
    return USER_NAMES[userId] || userId;
}

function CustomTooltip({ active, payload, label }) {
    if (!active || !payload || payload.length === 0) return null;
    return (
        <div className={styles.tooltip}>
            <p className={styles.tooltipTitle}>Jornada {label}</p>
            {payload.map((entry) => (
                <p key={entry.dataKey} className={styles.tooltipRow}>
                    <span
                        className={styles.tooltipDot}
                        style={{ background: entry.color || entry.stroke }}
                    />
                    {getDisplayName(entry.dataKey)}: {entry.value}º
                </p>
            ))}
        </div>
    );
}

export default function Evolucion() {
    const { user } = useAuth();
    const [matchdays, setMatchdays] = useState([]);
    const [evolution, setEvolution] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hidden, setHidden] = useState(() => new Set());

    const isAllowed = EVOLUTION_ADMIN_USERS.includes(user?.username);

    useEffect(() => {
        if (!isAllowed) {
            setLoading(false);
            return;
        }
        api.getStandingsHistory()
            .then((data) => {
                setMatchdays(data.matchdays || []);
                setEvolution(data.evolution || []);
            })
            .catch(() => setError('No se ha podido cargar la evolución'))
            .finally(() => setLoading(false));
    }, [isAllowed]);

    const colors = useMemo(() => {
        const map = {};
        evolution.forEach((entry, index) => {
            map[entry.userId] = PALETTE[index % PALETTE.length];
        });
        return map;
    }, [evolution]);

    const chartData = useMemo(() => {
        return matchdays.map((matchday, i) => {
            const row = { matchday };
            for (const entry of evolution) {
                row[entry.userId] = entry.positions[i];
            }
            return row;
        });
    }, [matchdays, evolution]);

    const nUsers = evolution.length;

    const toggleUser = (userId) => {
        setHidden((prev) => {
            const next = new Set(prev);
            if (next.has(userId)) next.delete(userId);
            else next.add(userId);
            return next;
        });
    };

    const showAll = () => setHidden(new Set());
    const hideAll = () => setHidden(() => new Set(evolution.map((e) => e.userId)));

    if (!isAllowed) {
        return (
            <div className={styles.container}>
                <p>No tienes permisos de administrador</p>
            </div>
        );
    }

    if (loading) return <Spinner />;

    const lastMatchday = matchdays[matchdays.length - 1];
    const visibleUsers = evolution.filter((e) => !hidden.has(e.userId));

    return (
        <div className={styles.container}>
            {error && <div className={styles.warningBanner}>{error}</div>}

            {!error && matchdays.length === 0 && (
                <div className={styles.infoBanner}>
                    Todavía no hay jornadas finalizadas
                </div>
            )}

            {!error && matchdays.length > 0 && evolution.length === 0 && (
                <div className={styles.infoBanner}>
                    No hay apuestas registradas
                </div>
            )}

            {!error && matchdays.length > 0 && evolution.length > 0 && (
                <>
                    <div className={styles.infoBanner}>
                        Después de Jornada {lastMatchday} · {matchdays.length} jornadas
                        finalizadas
                    </div>

                    <div className={styles.chartCard}>
                        <ResponsiveContainer width="100%" height={380}>
                            <LineChart data={chartData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                                <XAxis
                                    dataKey="matchday"
                                    type="number"
                                    domain={['dataMin', 'dataMax']}
                                    allowDuplicatedCategory={false}
                                    tick={{ fontSize: 11 }}
                                    tickLine={false}
                                    label={{ value: 'Jornadas finalizadas', position: 'insideBottom', offset: -2, fontSize: 11 }}
                                />
                                <YAxis
                                    type="number"
                                    domain={[1, nUsers]}
                                    reversed
                                    ticks={Array.from({ length: nUsers }, (_, i) => i + 1)}
                                    allowDecimals={false}
                                    tick={{ fontSize: 11 }}
                                    tickLine={false}
                                    width={35}
                                    label={{ value: 'Puesto', angle: -90, position: 'insideLeft', fontSize: 11 }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                {visibleUsers.map((entry) => (
                                    <Line
                                        key={entry.userId}
                                        dataKey={entry.userId}
                                        type="linear"
                                        stroke={colors[entry.userId]}
                                        strokeWidth={2}
                                        dot={{ r: 3 }}
                                        activeDot={{ r: 5 }}
                                        isAnimationActive={false}
                                        name={getDisplayName(entry.userId)}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className={styles.legendActions}>
                        <button
                            type="button"
                            className={styles.legendActionBtn}
                            onClick={showAll}
                            disabled={hidden.size === 0}
                        >
                            Todas
                        </button>
                        <button
                            type="button"
                            className={styles.legendActionBtn}
                            onClick={hideAll}
                            disabled={hidden.size === evolution.length}
                        >
                            Ninguna
                        </button>
                    </div>

                    <div className={styles.legend}>
                        {evolution.map((entry) => {
                            const isHidden = hidden.has(entry.userId);
                            return (
                                <button
                                    key={entry.userId}
                                    type="button"
                                    className={`${styles.chip} ${isHidden ? styles.chipHidden : ''}`}
                                    onClick={() => toggleUser(entry.userId)}
                                    aria-pressed={!isHidden}
                                >
                                    <span
                                        className={styles.chipDot}
                                        style={{ background: colors[entry.userId] }}
                                    />
                                    {getDisplayName(entry.userId)}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
