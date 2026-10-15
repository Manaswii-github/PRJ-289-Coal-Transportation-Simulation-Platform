import { useCallback, useEffect, useRef, useState } from "react";
import { getSimulationRange, getSimulationState } from "../services/simulationService";

const toInputDate = (value) => {
    if (!value) return "";
    return value.slice(0, 10);
};

const toInputTime = (value) => {
    if (!value) return "";
    return value.slice(11, 16);
};

const toApiTimestamp = (date, time) => {
    if (!date || !time) return null;
    return `${date}T${time}:00`;
};

export default function SimulationTimeControl({ onStateChange }) {
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [range, setRange] = useState(null);
    const [simulationTime, setSimulationTime] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const simulationTimeRef = useRef(null);
    const rangeRef = useRef(null);
    const onStateChangeRef = useRef(onStateChange);

    useEffect(() => {
        simulationTimeRef.current = simulationTime;
    }, [simulationTime]);

    useEffect(() => {
        rangeRef.current = range;
    }, [range]);

    useEffect(() => {
        onStateChangeRef.current = onStateChange;
    }, [onStateChange]);

    useEffect(() => {
        getSimulationRange()
            .then((data) => {
                setRange(data);

                if (data.min_time) {
                    setDate(toInputDate(data.min_time));
                    setTime(toInputTime(data.min_time));
                }
            })
            .catch(() => {
                setError("Unable to load simulation time range.");
            });
    }, []);

    const loadState = useCallback(async (timestamp) => {
        if (!timestamp) return;

        setLoading(true);
        setError("");

        try {
            const data = await getSimulationState(timestamp);
            const next = new Date(`${timestamp}+00:00`);

            simulationTimeRef.current = next;
            setSimulationTime(next);
            onStateChangeRef.current?.(data);
        } catch (err) {
            setError(
                err?.response?.data?.detail ||
                "Unable to load simulation state."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = window.setInterval(async () => {
            const current = simulationTimeRef.current;
            if (!current) return;

            const next = new Date(current.getTime() + 1000);
            const max = rangeRef.current?.max_time
                ? new Date(`${rangeRef.current.max_time}+00:00`)
                : null;

            if (max && next > max) {
                return;
            }

            simulationTimeRef.current = next;
            setSimulationTime(next);

            const timestamp = next.toISOString().slice(0, 19);

            try {
                const data = await getSimulationState(timestamp);
                onStateChangeRef.current?.(data);
            } catch {
                setError("Unable to update simulation state.");
            }
        }, 1000);

        return () => window.clearInterval(timer);
    }, []);

    const handleSetTime = () => {
        loadState(toApiTimestamp(date, time));
    };

    return (
        <div className="simulation-time-control">
            <div>
                <label>Date</label>
                <input
                    type="date"
                    value={date}
                    min={toInputDate(range?.min_time)}
                    max={toInputDate(range?.max_time)}
                    onChange={(event) => setDate(event.target.value)}
                />
            </div>

            <div>
                <label>Time</label>
                <input
                    type="time"
                    value={time}
                    onChange={(event) => setTime(event.target.value)}
                />
            </div>

            <button type="button" onClick={handleSetTime} disabled={loading}>
                {loading ? "Loading..." : "Set Time"}
            </button>

            {simulationTime && (
                <span>
                    Replay: {simulationTime.toLocaleString()}
                </span>
            )}

            {error && <span>{error}</span>}
        </div>
    );
}
