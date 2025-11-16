import { useState, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";

function PlayerSphere({ pos }) {
    return (
        <mesh position={[pos.x, pos.y, pos.z]}>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshStandardMaterial color="red" />
        </mesh>
    );
}

export default function App() {
    const [joined, setJoined] = useState(false);
    const [disconnected, setDisconnected] = useState(false);

    const [myPos, setMyPos] = useState({ x: 0, y: 0.5, z: 0 });
    const [players, setPlayers] = useState({});

    const logsRef = useRef("");
    const usernameRef = useRef(null);

    const wsRef = useRef(null);
    const heartbeatRef = useRef(null);
    const pidRef = useRef(null);

    function log(msg) {
        console.log(msg);
        logsRef.current += msg + "\n";
    }

    // -----------------------------
    // JOIN WORLD
    // -----------------------------
    async function joinWorld() {
        const username = usernameRef.current.value || "Guest";
        setDisconnected(false);

        log("Requesting world from lobby...");

        const res = await fetch("http://localhost:8000/join", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username })
        });

        const data = await res.json();
        const pid = data.player_id;
        const wsUrl = data.assigned_world.ws_url;

        pidRef.current = pid;

        log("Assigned world:");
        log(JSON.stringify(data, null, 2));
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

            // HEARTBEAT
            heartbeatRef.current = setInterval(() => {
                fetch(`http://localhost:8000/heartbeat/${pid}`, { method: "POST" })
                    .catch(err => log("Heartbeat failed: " + err));
            }, 2000);

            // Switch to game view
            setJoined(true);
        };

        ws.onmessage = evt => {
            const msg = JSON.parse(evt.data);

            if (msg.type === "state") {
                setPlayers(msg.players || {});
                if (msg.players[pid]) {
                    setMyPos(msg.players[pid]);
                }
            } else {
                log("Event: " + evt.data);
            }
        };

        ws.onerror = err => log("WebSocket error: " + err);

        ws.onclose = () => {
            log("Disconnected from world");

            // stop heartbeat
            if (heartbeatRef.current)
                clearInterval(heartbeatRef.current);

            // mark disconnected + show reconnect UI
            setJoined(false);
            setDisconnected(true);
        };
    }

    // -----------------------------
    // MOVEMENT
    // -----------------------------
    useEffect(() => {
        function handleKey(e) {
            if (!wsRef.current) return;

            if (["w", "a", "s", "d"].includes(e.key)) {
                wsRef.current.send(JSON.stringify({
                    type: "move",
                    pid: pidRef.current,
                    key: e.key
                }));
            }
        }

        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, []);

    // -----------------------------
    // RENDER
    // -----------------------------
    if (!joined) {
        return (
            <div style={{ padding: 20, width: 500 }}>
                <h2>
                    {disconnected ? "Disconnected From World" : "Simple World Join Demo (React)"}
                </h2>

                {disconnected && (
                    <div style={{ marginBottom: 10, color: "red" }}>
                        World ended.
                    </div>
                )}

                <input
                    ref={usernameRef}
                    placeholder="Enter username"
                    style={{ padding: "6px", width: "70%" }}
                />

                <button onClick={joinWorld} style={{ padding: "6px 12px", marginLeft: 10 }}>
                    {disconnected ? "Reconnect" : "Join World"}
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
                    {logsRef.current}
                </pre>
            </div>
        );
    }

    // -----------------------------
    // 3D GAME VIEW
    // -----------------------------
    return (
        <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
            <ambientLight intensity={1} />
            <directionalLight position={[10, 20, 10]} />

            {/* Ground */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
                <planeGeometry args={[200, 200]} />
                <meshStandardMaterial color="#555" />
            </mesh>

            {/* Other players */}
            {Object.entries(players).map(([id, p]) => {
                if (id == pidRef.current) return null;
                return <PlayerSphere key={id} pos={p} />;
            })}

            {/* You */}
            <PlayerSphere pos={myPos} />
        </Canvas>
    );
}
