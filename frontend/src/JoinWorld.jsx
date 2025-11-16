import { useState, useRef } from "react";

export default function JoinWorld({ onJoin }) {
    const HOST = "10.226.221.105";  // LAPTOP IP for phone access

    const [disconnected, setDisconnected] = useState(false);
    const [logs, setLogs] = useState("");

    const usernameRef = useRef(null);
    const wsRef = useRef(null);
    const heartbeatRef = useRef(null);

    function log(m) {
        console.log(m);
        setLogs(prev => prev + m + "\n");
    }

    async function joinWorld() {
        setDisconnected(false);
        const username = usernameRef.current.value || "Guest";
        log("Requesting world...");

        // Make sure phone can reach it — USE LAPTOP IP
        const res = await fetch(`http://${HOST}:8000/join`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username })
        });

        const data = await res.json();
        const pid = data.player_id;
        const wsUrl = data.assigned_world.ws_url.replace("localhost", HOST);

        log("Connecting WS: " + wsUrl);

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            log("Connected to world!");

            ws.send(JSON.stringify({
                type: "join",
                pid,
                username
            }));

            // HEARTBEAT MUST ALSO USE LAPTOP IP
            heartbeatRef.current = setInterval(() => {
                fetch(`http://${HOST}:8000/heartbeat/${pid}`, { method: "POST" })
                    .catch(() => { });
            }, 2000);

            onJoin({
                pid,
                ws,
                heartbeat: heartbeatRef,
                username
            });
        };

        ws.onclose = () => {
            log("Disconnected");
            setDisconnected(true);
            if (heartbeatRef.current) clearInterval(heartbeatRef.current);
        };
    }

    return (
        <div style={{ padding: 20, width: 500 }}>
            <h2>{disconnected ? "Disconnected" : "Join World"}</h2>

            <input
                ref={usernameRef}
                placeholder="Enter username"
                style={{ padding: "6px", width: "70%" }}
            />

            <button onClick={joinWorld} style={{ padding: "6px 12px", marginLeft: 10 }}>
                {disconnected ? "Reconnect" : "Join"}
            </button>

            <pre
                style={{
                    marginTop: 20,
                    padding: 10,
                    background: "#eee",
                    height: 300,
                    overflowY: "scroll",
                    whiteSpace: "pre-wrap"
                }}
            >
                {logs}
            </pre>
        </div>
    );
}
