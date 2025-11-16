import { useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import FollowCam from "./game/FollowCam";
import nipplejs from "nipplejs";
import WorldBoundary from "./game/WorldBoundary";

function PlayerSphere({ pos }) {
    return (
        <mesh position={[pos.x, pos.y, pos.z]}>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshStandardMaterial color="red" />
        </mesh>
    );
}

export default function Game({ pid, ws, heartbeat, setSession }) {
    const [players, setPlayers] = useState({});
    const [zombies, setZombies] = useState({});
    const [myPos, setMyPos] = useState({ x: 0, y: 0.5, z: 0 });
    const [hp, setHp] = useState(100);

    // NEW STATE FOR ROUND SYSTEM
    const [phase, setPhase] = useState("play");
    const [timer, setTimer] = useState(70);
    const [winner, setWinner] = useState(null);

    // Store latest position safely for movement useEffect
    const myPosRef = useRef(myPos);
    useEffect(() => { myPosRef.current = myPos }, [myPos]);

    // -----------------------------
    // HANDLE WS MESSAGES
    // -----------------------------
    useEffect(() => {
        ws.onmessage = evt => {
            const msg = JSON.parse(evt.data);

            if (msg.type === "state") {
                setPlayers(msg.players || {});
                setZombies(msg.zombies || {});
                setPhase(msg.phase);
                setTimer(msg.timer);
                setWinner(msg.winner);

                if (msg.players[pid]) {
                    setMyPos(msg.players[pid]);
                    setHp(msg.players[pid].hp);
                }
            }
        };

        ws.onclose = () => {
            if (heartbeat.current) clearInterval(heartbeat.current);
            setSession(null);
        };
    }, [ws, pid]);

    const MAX_RADIUS = 30;

    function insideCircle(x, z) {
        return (x * x + z * z) <= (MAX_RADIUS * MAX_RADIUS);
    }

    // -----------------------------
    // JOYSTICK MOVEMENT
    // -----------------------------
    useEffect(() => {
        const zone = document.getElementById("joystick-zone");
        const manager = nipplejs.create({
            zone,
            mode: "dynamic",
            color: "white",
        });

        manager.on("move", (evt, data) => {
            if (phase !== "play") return;

            if (!data?.direction) return;

            const dir = data.direction.angle;
            let key = null;
            if (dir === "up") key = "w";
            if (dir === "down") key = "s";
            if (dir === "left") key = "a";
            if (dir === "right") key = "d";

            let { x, z } = myPosRef.current;
            if (!insideCircle(x, z)) return;

            if (key) {
                ws.send(JSON.stringify({
                    type: "move",
                    pid,
                    key
                }));
            }
        });

        return () => manager.destroy();
    }, [ws, pid, phase]);

    // -----------------------------
    // WINNER SCREEN (results phase)
    // -----------------------------
    const showResults = (phase === "results");

    return (
        <>
            {/* JOYSTICK */}
            <div id="joystick-zone"
                style={{
                    position: "fixed",
                    background: "rgba(0,0,0,0.1)",
                    bottom: "20px",
                    left: "20px",
                    right: "20px",
                    margin: "auto",
                    width: "150px",
                    height: "150px",
                    borderRadius: "50%",
                    zIndex: 10
                }} />

            {/* HP */}
            <div style={{
                position: "fixed",
                top: 20,
                left: 20,
                fontSize: 24,
                color: "lime",
                zIndex: 10
            }}>
                HP: {hp}
            </div>

            {/* TIMER */}
            {
                !showResults && <div style={{
                    position: "fixed",
                    top: 20,
                    right: 20,
                    fontSize: 32,
                    color: "black",
                    zIndex: 10
                }}>
                    {Math.ceil(timer) - 3}
                </div>
            }


            {/* RESULTS OVERLAY */}
            {showResults && (
                <div style={{
                    position: "fixed",
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: "rgba(0,0,0,0.85)",
                    color: "white",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    fontSize: 40,
                    zIndex: 50
                }}>
                    <div>ROUND OVER</div>
                    <div style={{ marginTop: 20, fontSize: 50 }}>
                        Winner: {winner ?? "None"}
                    </div>
                    <div style={{ marginTop: 40 }}>
                        Next round in {Math.ceil(timer)}s
                    </div>
                </div>
            )}

            <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
                <ambientLight intensity={1} />
                <directionalLight position={[10, 20, 10]} />

                <WorldBoundary radius={MAX_RADIUS} />

                <FollowCam target={myPos} />

                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
                    <planeGeometry args={[200, 200]} />
                    <meshStandardMaterial color="#555" />
                </mesh>

                {Object.entries(zombies).map(([id, z]) => (
                    <mesh key={id} position={[z.x, z.y, z.z]}>
                        <sphereGeometry args={[0.6, 16, 16]} />
                        <meshStandardMaterial color="green" />
                    </mesh>
                ))}

                {Object.entries(players).map(([id, p]) => {
                    if (id == pid) return null;
                    return <PlayerSphere key={id} pos={p} />;
                })}

                <PlayerSphere pos={myPos} />
            </Canvas>
        </>
    );
}
