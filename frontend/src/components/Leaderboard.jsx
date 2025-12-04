import { useEffect, useState } from "react";

const IP = "10.226.221.155"
export default function Leaderboard() {
    const [rows, setRows] = useState([]);

    useEffect(() => {
        fetch(`http://${IP}:8000/leaderboard`)
            .then(r => r.json())
            .then(data => {
                const sorted = [...data.leaderboard].sort((a, b) => {
                    if (b.max_round !== a.max_round) return b.max_round - a.max_round;
                    if (b.kills !== a.kills) return b.kills - a.kills;
                    return b.survival_time - a.survival_time;
                });
                setRows(sorted);
            })
            .catch(err => console.error("Leaderboard error:", err));
    }, []);

    const formatTime = (t) => `${Math.floor(t)}s`;

    return (
        <div
            id="leaderboard"
        >
            <h3 style={{ margin: 0, marginBottom: "10px", textAlign: "center" }}>
                Leaderboard
            </h3>

            {/* Header */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "30px 1fr 50px 50px 50px",
                    paddingBottom: "6px",
                    borderBottom: "1px solid rgba(255,255,255,0.2)",
                    marginBottom: "6px",
                    fontSize: "12px",
                    opacity: 0.7,
                }}
            >
                <div>#</div>
                <div>Player</div>
                <div>Kills</div>
                <div>Round</div>
                <div>Survived</div>
            </div>

            {/* Rows */}
            {rows.map((row, i) => (
                <div
                    key={i}
                    style={{
                        display: "grid",
                        gridTemplateColumns: "30px 1fr 40px 40px 50px",
                        padding: "4px 0",
                        borderBottom: "1px solid rgba(255,255,255,0.1)",
                        fontSize: "13px",
                    }}
                >
                    <div>{i + 1}</div>
                    <div>{row.username}</div>
                    <div>{row.kills}</div>
                    <div>{row.max_round}</div>
                    <div>{formatTime(row.survival_time)}</div>
                </div>
            ))}
        </div>
    );
}
