import { useState, useRef } from "react";

export default function JoinWorld({ onJoin }) {
    const HOST = "10.226.221.105";

    const [disconnected, setDisconnected] = useState(false);
    const [logs, setLogs] = useState("");
    const [joining, setJoining] = useState(false);   // <-- NEW

    const usernameRef = useRef(null);
    const wsRef = useRef(null);
    const heartbeatRef = useRef(null);

    function log(m) {
        console.log(m);
        setLogs(prev => prev + m + "\n");
    }

    async function joinWorld() {
        if (joining) return;           // <-- prevents double click
        setJoining(true);              // <-- lock button

        setDisconnected(false);
        const username = usernameRef.current.value || "Guest";
        log("Requesting world...");

        try {
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

                setJoining(false);     // <-- allow reconnection
            };

        } catch (err) {
            console.error(err);
            log("Join failed!");
            setJoining(false);         // <-- re-enable button on failure
        }
    }

    return (
        <div style={{ padding: 20, width: 500 }}>

            <input
                ref={usernameRef}
                placeholder="Enter username"
                style={{ padding: "6px" }}
            />

            <button
                onClick={joinWorld}
                disabled={joining}               // <-- NEW
                style={{
                    padding: "6px 12px",
                    marginLeft: 10,
                    opacity: joining ? 0.5 : 1, // <-- feedback
                    cursor: joining ? "not-allowed" : "pointer"
                }}
            >
                {joining
                    ? "Joining..."
                    : disconnected
                        ? "Reconnect"
                        : "Join"}
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
