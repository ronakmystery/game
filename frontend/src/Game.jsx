import { useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import FollowCam from "./game/FollowCam";
import nipplejs from "nipplejs";
import WorldBoundary from "./game/WorldBoundary";
import AnimatedFBX from "./AnimatedFBX.jsx";

import EnvironmentFloor from "./game/EnvironmentFloor.jsx";


import * as THREE from "three";

import Potion from "./game/Potion.jsx";



export default function Game({ pid, ws, heartbeat, setSession }) {
    const [players, setPlayers] = useState({});
    const [zombies, setZombies] = useState({});
    const [myPos, setMyPos] = useState({ x: 0, y: 0.5, z: 0 });
    const [hp, setHp] = useState(100);

    const [rotation, setRotation] = useState([0, 0, 0]);
    const targetRot = useRef(0);

    const [potions, setPotions] = useState({});




    const [usernames, setUsernames] = useState({});


    const oldPlayers = useRef({});
    const oldZombies = useRef({});





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


            // ---------------------------
            // 📌 1. Handle DEATH message
            // ---------------------------
            if (msg.type === "death") {
                alert("❌ YOU DIED!");

                if (heartbeat.current) clearInterval(heartbeat.current);

                setSession(null);     // Exit game session or go to menu
                return;               // <--- IMPORTANT so we STOP processing STATE
            }


            if (msg.type === "state") {




                const updated = msg.players || {};

                // compute facing direction for each remote player
                Object.entries(updated).forEach(([id, p]) => {
                    if (id == pid) return; // skip yourself

                    const prev = oldPlayers.current[id];

                    if (prev) {
                        const dx = p.x - prev.x;
                        const dz = p.z - prev.z;

                        // moving?
                        if (Math.abs(dx) > 0.0005 || Math.abs(dz) > 0.0005) {
                            // compute angle from movement vector
                            p.rotation = Math.atan2(dx, -dz);
                        } else {
                            // standing still → keep old angle
                            p.rotation = prev.rotation ?? 0;
                        }
                    } else {
                        // first time seeing this player
                        p.rotation = 0;
                    }

                    // Save current position + rotation
                    oldPlayers.current[id] = {
                        x: p.x,
                        z: p.z,
                        rotation: p.rotation
                    };
                });


                setPlayers(updated)

                // --- COMPUTE ZOMBIE ROTATION ---
                const updatedZombies = msg.zombies || {};

                Object.entries(updatedZombies).forEach(([id, z]) => {
                    const prev = oldZombies.current[id];

                    if (prev) {
                        const dx = z.x - prev.x;
                        const dz = z.z - prev.z;

                        // If zombie moved, calculate direction
                        if (Math.abs(dx) > 0.0005 || Math.abs(dz) > 0.0005) {
                            z.rotation = Math.atan2(dx, -dz);
                        } else {
                            z.rotation = prev.rotation ?? 0;
                        }
                    } else {
                        z.rotation = 0;
                    }

                    // Save for next frame
                    oldZombies.current[id] = {
                        x: z.x,
                        z: z.z,
                        rotation: z.rotation
                    };
                });

                setZombies(updatedZombies);



                setPotions(msg.potions || {});
                setPhase(msg.phase);
                setTimer(msg.timer);
                setWinner(msg.winner);

                // Extract usernames
                const nameMap = {};
                for (const id in msg.players) {
                    nameMap[id] = msg.players[id].username;
                }
                setUsernames(nameMap);


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
            if (!data?.vector) return;

            const vx = data.vector.x;   // horizontal joystick movement
            const vz = data.vector.y;   // vertical joystick movement

            // Convert joystick vector → 3D model rotation
            const angle = Math.atan2(vx, -vz);

            // Apply rotation directly
            setRotation([0, angle, 0]);

            // Movement keys to backend (optional)
            const dir = data.direction?.angle;
            let key = null;
            if (dir === "up") key = "w";
            if (dir === "down") key = "s";
            if (dir === "left") key = "a";
            if (dir === "right") key = "d";

            if (key) {
                ws.send(JSON.stringify({ type: "move", pid, key }));
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
                !showResults && phase !== "waiting" && <div style={{
                    position: "fixed",
                    top: 20,
                    right: 20,
                    fontSize: 32,
                    color: "red",
                    zIndex: 10
                }}>
                    {Math.ceil(timer)}
                </div>
            }
            {phase === "waiting" && (
                <div style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.8)",
                    color: "white",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 50,
                    fontSize: 40
                }}>
                    <div>Waiting for players...</div>
                    <div style={{ marginTop: 20, fontSize: 60 }}>
                        {Math.ceil(timer) - 60}
                    </div>
                </div>
            )}




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

                    <div style={{ marginTop: 20, fontSize: 50, color: winner === pid ? "#00ff00" : "white" }}>
                        {winner === pid
                            ? "YOU WIN!"
                            : `Winner: ${usernames[winner] ?? "None"}`}
                    </div>


                </div>
            )}


            <Canvas camera={{ position: [0, 5, 10], fov: 50 }}
                shadows
                gl={{ antialias: true }}

                onCreated={(state) => {
                    state.scene.fog = new THREE.Fog("#151515", 15, 80);
                    state.scene.background = new THREE.Color("#0c0c0c");
                }}
            >
                <ambientLight intensity={1} />
                <directionalLight
                    castShadow
                    position={[15, 30, 10]}
                    intensity={1.5}
                    shadow-mapSize-width={2048}
                    shadow-mapSize-height={2048}
                    shadow-camera-near={0.1}
                    shadow-camera-far={80}
                    shadow-camera-left={-20}
                    shadow-camera-right={20}
                    shadow-camera-top={20}
                    shadow-camera-bottom={-20}
                />



                <FollowCam target={myPos} />


                <EnvironmentFloor receiveShadow scale={10} position={[0, 0, 0]} />

                {Object.entries(zombies).map(([id, z]) => (
                    <AnimatedFBX
                        key={id}
                        url="/models/zombie.fbx"
                        scale={0.025}
                        position={z}
                        rotation={[0, z.rotation || 0, 0]}
                    />
                ))}



                {/* OTHER PLAYERS */}
                {Object.entries(players).map(([id, p]) => {
                    if (id == pid) return null;

                    return (
                        <AnimatedFBX
                            key={id}
                            url="/models/run.fbx"
                            scale={0.01}
                            position={p}
                            rotation={[0, p.rotation || 0, 0]}
                        />
                    );
                })}


                {/* YOUR PLAYER */}
                <AnimatedFBX
                    url={"/models/run.fbx"}     // we'll compute this next
                    scale={0.01}
                    position={myPos}
                    rotation={rotation}
                />

                {Object.entries(potions).map(([id, pot]) => (
                    <Potion key={id} pos={pot} />
                ))}




            </Canvas>
        </>
    );
}
