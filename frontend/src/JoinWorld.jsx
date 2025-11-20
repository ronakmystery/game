import { useState, useRef, useEffect } from "react";
import LobbyInfo from "./game/LobbyInfo";

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

    useEffect(() => {
        const audio = new Audio("/sounds/terminal.mp3");
        audio.loop = true;
        audio.volume = 0.35;

        // Must wait for user interaction to avoid autoplay block
        const startAudio = () => {
            audio.play().catch(() => { });
            window.removeEventListener("click", startAudio);
            window.removeEventListener("keydown", startAudio);
        };

        window.addEventListener("click", startAudio);
        window.addEventListener("keydown", startAudio);

        return () => {
            audio.pause();
        };
    }, []);



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
        <div id="lobby-terminal">

            <div className="crt-overlay"></div>

            <h4 className="terminal-title">[ ZOMBIE OUTBREAK MAIN TERMINAL ]</h4>

            <label className="terminal-label">Enter Codename:</label>

            <input ref={usernameRef} placeholder="codename" className="terminal-input" />

            <button
                onClick={joinWorld}
                disabled={joining}
                className={"terminal-button " + (joining ? "joining" : "")}
            >
                {joining
                    ? "CONNECTING..."
                    : disconnected
                        ? "RECONNECT"
                        : "JOIN WORLD"}
            </button>

            <div className="terminal-panel">
                <LobbyInfo host={`http://${HOST}:8000`} />
            </div>

            <h5 className="terminal-log-title">Terminal Logs</h5>

            <pre className="terminal-logs">{logs}</pre>

            <div className={
                "terminal-status " +
                (joining ? "connecting" : disconnected ? "disconnected" : "")
            }>
                [ STATUS: {joining ? "CONNECTING" : disconnected ? "DISCONNECTED" : "IDLE"} ]
            </div>

        </div>
    );

}
