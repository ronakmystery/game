import { useState, useRef } from "react";

export default function App() {
    const [logs, setLogs] = useState("");
    const usernameRef = useRef(null);
    const wsRef = useRef(null);
    const heartbeatRef = useRef(null);

    function log(msg) {
        setLogs(prev => prev + msg + "\n");
    }

    async function joinWorld() {
        const username = usernameRef.current.value || "Guest";
        log("Requesting world from lobby...");

        // 1. Ask balancer for world assignment
        const res = await fetch("http://localhost:8000/join", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username })
        });

        const data = await res.json();
        const pid = data.player_id;
        const wsUrl = data.assigned_world.ws_url;

        log("Assigned world:");
        log(JSON.stringify(data, null, 2));
        log("Connecting WS: " + wsUrl);

        // 2. Create WebSocket
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            log("Connected to world!");

            ws.send(JSON.stringify({
                type: "join",
                pid,
                username
            }));

            // Heartbeat loop
            heartbeatRef.current = setInterval(() => {
                fetch(`http://localhost:8000/heartbeat/${pid}`, { method: "POST" })
                    .catch(err => log("Heartbeat failed: " + err));
                log("Sent heartbeat");
            }, 2000);
        };

        ws.onmessage = (msg) => log("World event: " + msg.data);

        ws.onerror = (err) => log("WebSocket error: " + err);

        ws.onclose = () => {
            log("Disconnected from world");
            if (heartbeatRef.current) clearInterval(heartbeatRef.current);
        };
    }

    return (
        <div style={{ padding: "20px", fontFamily: "Arial", width: "500px" }}>
            <h2>Simple World Join Demo (React)</h2>

            <input
                ref={usernameRef}
                placeholder="Enter username"
                style={{ padding: "6px", width: "70%" }}
            />

            <button onClick={joinWorld} style={{ padding: "6px 12px", marginLeft: "10px" }}>
                Join World
            </button>

            <pre
                style={{
                    marginTop: "20px",
                    padding: "10px",
                    background: "#eee",
                    height: "300px",
                    overflowY: "scroll",
                    whiteSpace: "pre-wrap"
                }}
            >
                {logs}
            </pre>
        </div>
    );
}
