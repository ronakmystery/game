import { useEffect, useState } from "react";

export default function LobbyInfo({ host = "http://localhost:8000" }) {
    const [worlds, setWorlds] = useState([]);
    const [players, setPlayers] = useState([]);

    useEffect(() => {
        async function refresh() {
            try {
                const w = await fetch(`${host}/worlds`).then(r => r.json());
                const p = await fetch(`${host}/players`).then(r => r.json());
                setWorlds(w);
                setPlayers(p);
            } catch (err) {
                console.error("debug fetch error:", err);
            }
        }

        refresh();
        const t = setInterval(refresh, 1000);
        return () => clearInterval(t);
    }, [host]);

    return (
        <div className="terminal-panel info-panel">

            <h4 className="terminal-subtitle">[ OUTBREAK STATUS ]</h4>

            {/* WORLDS */}
            <h5 className="info-section-title">Active Worlds</h5>
            {worlds.length === 0 && <div className="info-empty">No worlds*</div>}

            {worlds.map(w => (
                <div key={w.id} className="world-card">
                    <div>World #{w.id} – {w.name}</div>
                    <div>Port: {w.port}</div>
                    <div>Players: {w.players}</div>
                    <div>Age: {w.age.toFixed(1)}s</div>

                    <div className="expires-row">
                        Expires in:
                        <span className={
                            w.expires_in < 10 ? "expires-warn" : "expires-ok"
                        }>
                            {" "}{w.expires_in.toFixed(1)}s
                        </span>
                    </div>

                    <div className="danger-meter">
                        <div
                            className={`danger-fill ${w.players > 5 ? "danger-high" : "danger-low"}`}
                            style={{ width: `${Math.min(w.players * 12, 100)}%` }}
                        ></div>
                    </div>
                </div>
            ))}

            {/* PLAYERS */}
            <h3 className="info-section-title">Survivors</h3>
            {players.length === 0 && <div className="info-empty">No active survivors*</div>}

            {players.map(p => (
                <div key={p.id} className="player-card">
                    <div>Player: {p.username}</div>
                    <div>ID: {p.id}</div>
                    <div>World: {p.world}</div>
                    <div>Last Seen: {p.last_seen.toFixed(1)}s ago</div>
                </div>
            ))}
        </div>
    );
}
