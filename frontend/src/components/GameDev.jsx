import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRef, useEffect, useState } from "react";

let holdLoop = null;              // Only ONE interval ever runs
let currentDir = { x: 0, y: 0 };  // Track active direction

export default function Game3D({ username }) {
    const WS_URL = "ws://10.226.221.105:8001/ws";

    const wsRef = useRef(null);
    const [connected, setConnected] = useState(false);
    const [gameState, setGameState] = useState(null);

    // ----------------------------
    // Connect WebSocket
    // ----------------------------
    useEffect(() => {
        if (!username) return;

        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
            setConnected(true);
            ws.send(JSON.stringify({ type: "join", username, world: "world_dev" }));
        };

        ws.onmessage = evt => {
            const data = JSON.parse(evt.data);
            if (data.type === "state") setGameState(data.game);
        };

        ws.onclose = () => setConnected(false);
        return () => ws.close();
    }, [username]);

    // ----------------------------
    // SEND MOVEMENT PACKET
    // ----------------------------
    function sendMove(x, y) {
        currentDir = { x, y };
        const ws = wsRef.current;

        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        ws.send(JSON.stringify({ type: "move", x, y }));
    }

    // ----------------------------
    // HOLD START
    // ----------------------------
    function startHold(x, y) {
        stopHold();              // <<< STOP previous direction loop fully
        sendMove(x, y);          // send immediate movement

        // repeat sending every 80ms
        holdLoop = setInterval(() => {
            sendMove(x, y);
        }, 80);
    }

    // ----------------------------
    // HOLD STOP (on release)
    // ----------------------------
    function stopHold() {
        if (holdLoop !== null) {
            clearInterval(holdLoop);
            holdLoop = null;
        }
        sendMove(0, 0);          // <<< STOP MOVEMENT IMMEDIATELY
    }

    return (
        <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
            <Canvas camera={{ position: [0, 5, 10], fov: 50 }} style={{ width: "100%", height: "50%", background: 'red' }}>
                <ambientLight intensity={0.4} />
                <directionalLight position={[10, 10, 5]} intensity={1} />

                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[5, 5]} />
                    <meshStandardMaterial color="#222" />
                </mesh>

                {gameState && gameState.players[username] && (
                    <mesh
                        position={[
                            gameState.players[username].x,
                            1,
                            -gameState.players[username].y
                        ]}
                    >
                        <boxGeometry args={[1, 1, 1]} />
                        <meshStandardMaterial color="hotpink" />
                    </mesh>
                )}

                {gameState &&
                    Object.entries(gameState.players).map(([name, p]) => {
                        if (name === username) return null;

                        return (
                            <mesh key={name} position={[p.x, 1, -p.y]}>
                                <boxGeometry args={[1, 1, 1]} />
                                <meshStandardMaterial color="skyblue" />
                            </mesh>
                        );
                    })
                }

                <OrbitControls />
            </Canvas>

            {/* ======================== */}
            {/*         DPAD             */}
            {/* ======================== */}
            <div
                style={{
                    position: "absolute",
                    bottom: "50%",
                    left: "50%",
                    transform: "translate(-50%, 50%)",
                    width: 240,
                    height: 240,
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 80px)",
                    gridTemplateRows: "repeat(3, 80px)",
                    gap: 6,
                    zIndex: 9999,
                    userSelect: "none",
                    touchAction: "none"
                }}
            >
                {/* UP */}
                <div />
                <button
                    style={btn}
                    onMouseDown={() => startHold(0, 1)}
                    onMouseUp={stopHold}
                    onMouseLeave={stopHold}
                    onTouchStart={() => startHold(0, 1)}
                    onTouchEnd={stopHold}
                >
                    ▲
                </button>
                <div />

                {/* LEFT */}
                <button
                    style={btn}
                    onMouseDown={() => startHold(-1, 0)}
                    onMouseUp={stopHold}
                    onMouseLeave={stopHold}
                    onTouchStart={() => startHold(-1, 0)}
                    onTouchEnd={stopHold}
                >
                    ◀
                </button>

                <div />

                {/* RIGHT */}
                <button
                    style={btn}
                    onMouseDown={() => startHold(1, 0)}
                    onMouseUp={stopHold}
                    onMouseLeave={stopHold}
                    onTouchStart={() => startHold(1, 0)}
                    onTouchEnd={stopHold}
                >
                    ▶
                </button>

                <div />

                {/* DOWN */}
                <button
                    style={btn}
                    onMouseDown={() => startHold(0, -1)}
                    onMouseUp={stopHold}
                    onMouseLeave={stopHold}
                    onTouchStart={() => startHold(0, -1)}
                    onTouchEnd={stopHold}
                >
                    ▼
                </button>
                <div />
            </div>
        </div>
    );
}

const btn = {
    width: "80px",
    height: "80px",
    fontSize: "32px",
    background: "rgba(0,0,0,0.7)",
    color: "white",
    border: "2px solid #444",
    borderRadius: "15px"
};
