import { useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import nipplejs from "nipplejs";

import FollowCam from "./game/FollowCam";
import AnimatedFBX from "./AnimatedFBX.jsx";
import EnvironmentFloor from "./game/EnvironmentFloor.jsx";

import ItemModel from "./game/ItemModel.jsx"; // heal + bomb items

import { HealEffect, BombEffect } from "./game/Effects.jsx";

export default function Game({ pid, ws, heartbeat, setSession }) {
    const [players, setPlayers] = useState({});
    const [zombies, setZombies] = useState({});
    const [items, setItems] = useState({});
    const [myPos, setMyPos] = useState({ x: 0, y: 0.5, z: 0 });
    const [hp, setHp] = useState(100);
    const [rotation, setRotation] = useState([0, 0, 0]);

    const [inventory, setInventory] = useState({ heal: 0, bomb: 0 });

    const [phase, setPhase] = useState("play");
    const [timer, setTimer] = useState(70);
    const [winner, setWinner] = useState(null);
    const [usernames, setUsernames] = useState({});

    const oldPlayers = useRef({});
    const oldZombies = useRef({});

    const [effects, setEffects] = useState([]);

    const [leaderboard, setLeaderboard] = useState([]);


    // ----------------------------------------
    // HANDLE WS MESSAGES
    // ----------------------------------------
    useEffect(() => {
        ws.onmessage = evt => {
            const msg = JSON.parse(evt.data);

            // Death screen
            if (msg.type === "death") {
                alert("❌ YOU DIED!");
                if (heartbeat.current) clearInterval(heartbeat.current);
                setSession(null);
                return;
            }

            if (msg.type === "state") {
                // ---------------- Players ----------------
                const updatedPlayers = msg.players || {};

                Object.entries(updatedPlayers).forEach(([id, p]) => {
                    if (id == pid) return;

                    const prev = oldPlayers.current[id];
                    if (prev) {
                        const dx = p.x - prev.x;
                        const dz = p.z - prev.z;

                        if (Math.abs(dx) > 0.001 || Math.abs(dz) > 0.001)
                            p.rotation = Math.atan2(dx, -dz);
                        else
                            p.rotation = prev.rotation ?? 0;
                    } else {
                        p.rotation = 0;
                    }

                    oldPlayers.current[id] = {
                        x: p.x,
                        z: p.z,
                        rotation: p.rotation
                    };
                });

                setPlayers(updatedPlayers);

                // ---------------- Zombies ----------------
                const updatedZombies = msg.zombies || {};
                Object.entries(updatedZombies).forEach(([id, z]) => {
                    const prev = oldZombies.current[id];
                    if (prev) {
                        const dx = z.x - prev.x;
                        const dz = z.z - prev.z;

                        if (Math.abs(dx) > 0.001 || Math.abs(dz) > 0.001)
                            z.rotation = Math.atan2(dx, -dz);
                        else
                            z.rotation = prev.rotation ?? 0;

                    } else {
                        z.rotation = 0;
                    }

                    oldZombies.current[id] = {
                        x: z.x,
                        z: z.z,
                        rotation: z.rotation
                    };
                });

                setZombies(updatedZombies);

                setLeaderboard(msg.leaderboard);

                // ---------------- Items ----------------
                setItems(msg.items || {});

                // ---------------- Round logic ----------------
                setPhase(msg.phase);
                setTimer(msg.timer);
                setWinner(msg.winner);

                // ---------------- Usernames ----------------
                const map = {};
                for (const id in msg.players)
                    map[id] = msg.players[id].username;

                setUsernames(map);

                // ---------------- Self data ----------------
                if (msg.players[pid]) {
                    setMyPos(msg.players[pid]);
                    setHp(msg.players[pid].hp);
                    setInventory(msg.players[pid].inventory);
                }
            }
        };

        ws.onclose = () => {
            if (heartbeat.current) clearInterval(heartbeat.current);
            setSession(null);
        };
    }, [ws]);

    // ----------------------------------------
    // JOYSTICK MOVEMENT
    // ----------------------------------------
    useEffect(() => {
        const zone = document.getElementById("joystick-zone");
        const manager = nipplejs.create({
            zone,
            mode: "dynamic",
            color: "white"
        });

        manager.on("move", (_, data) => {
            if (!data?.vector) return;

            const vx = data.vector.x;
            const vz = data.vector.y;

            const angle = Math.atan2(vx, -vz);
            setRotation([0, angle, 0]);

            const dir = data.direction?.angle;
            let key = null;
            if (dir === "up") key = "w";
            if (dir === "down") key = "s";
            if (dir === "left") key = "a";
            if (dir === "right") key = "d";

            if (key) ws.send(JSON.stringify({ type: "move", pid, key }));
        });

        return () => manager.destroy();
    }, []);

    // ----------------------------------------
    // Inventory buttons
    // ----------------------------------------
    function useHeal() {
        if (inventory.heal > 0)
            ws.send(JSON.stringify({ type: "use_heal", pid }));
        setEffects(e => [...e, { type: "heal", pos: myPos }]);

    }

    function useBomb() {
        if (inventory.bomb > 0)
            ws.send(JSON.stringify({ type: "use_bomb", pid }));
        setEffects(e => [...e, { type: "bomb", pos: myPos }]);
    }

    const showResults = (phase === "results");

    return (
        <>
            <div className="leaderboard">
                {leaderboard.map((p, i) => (
                    <div key={p.pid}>
                        #{i + 1} {p.username}: {p.kills} kills (HP {p.hp})
                    </div>
                ))}
            </div>


            {/* ----------------------------------------
                Joystick
            ---------------------------------------- */}
            <div id="joystick-zone" style={{
                position: "fixed",
                bottom: 20, left: 20,
                width: 150, height: 150,
                background: "rgba(255,255,255,0.05)",
                borderRadius: "50%",
                zIndex: 10
            }} />

            {/* ----------------------------------------
                HP
            ---------------------------------------- */}
            <div style={{
                position: "fixed",
                top: 20, left: 20,
                color: "lime",
                fontSize: 26,
                zIndex: 10
            }}>
                HP: {hp}
            </div>

            {/* Inventory UI */}
            <div style={{
                position: "fixed",
                bottom: 20,
                right: 20,
                zIndex: 10,
                display: "flex",
                flexDirection: "column",
                gap: "10px"
            }}>
                <button
                    disabled={inventory.heal <= 0}
                    onClick={useHeal}
                    style={{ padding: "10px 20px", fontSize: 20 }}
                >
                    HEAL ({inventory.heal})
                </button>


                <button
                    disabled={inventory.bomb <= 0}
                    onClick={useBomb}
                    style={{ padding: "10px 20px", fontSize: 20 }}
                >
                    BOMB ({inventory.bomb})
                </button>
            </div>

            {/* ----------------------------------------
                Timer
            ---------------------------------------- */}
            {!showResults && phase !== "waiting" && (
                <div style={{
                    position: "fixed",
                    top: 20,
                    right: 20,
                    color: "red",
                    fontSize: 30,
                    zIndex: 10
                }}>
                    {Math.ceil(timer)}
                </div>
            )}

            {/* ----------------------------------------
                Waiting screen
            ---------------------------------------- */}
            {phase === "waiting" && (
                <div style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.85)",
                    color: "white",
                    fontSize: 40,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 50
                }}>
                    Waiting for players...
                </div>
            )}

            {/* ----------------------------------------
                Results screen
            ---------------------------------------- */}
            {showResults && (
                <div style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.9)",
                    color: "white",
                    fontSize: 40,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 50
                }}>
                    <div>ROUND OVER</div>
                    <div style={{
                        fontSize: 60,
                        marginTop: 20,
                        color: winner === pid ? "lime" : "white"
                    }}>
                        {winner === pid ? "YOU WIN!" :
                            "Winner: " + (usernames[winner] || "None")}
                    </div>
                </div>
            )}

            {/* ----------------------------------------
                3D WORLD
            ---------------------------------------- */}
            <Canvas
                camera={{ position: [0, 5, 10], fov: 55 }}
                shadows
                onCreated={(state) => {
                    state.scene.background = new THREE.Color("#0e0e0e");
                    state.scene.fog = new THREE.Fog("#0e0e0e", 15, 80);
                }}
            >


                {effects.map((fx, i) => {
                    if (fx.type === "heal") {
                        return (
                            <HealEffect
                                key={i}
                                pos={fx.pos}
                                onDone={() => {
                                    setEffects(effects => effects.filter((_, idx) => idx !== i));
                                }}
                            />
                        );
                    }

                    if (fx.type === "bomb") {
                        return (
                            <BombEffect
                                key={i}
                                pos={fx.pos}
                                onDone={() => {
                                    setEffects(effects => effects.filter((_, idx) => idx !== i));
                                }}
                            />
                        );
                    }
                })}
                <ambientLight intensity={1} />
                <directionalLight
                    castShadow
                    position={[15, 30, 15]}
                    intensity={1.6}
                    shadow-mapSize-width={2048}
                    shadow-mapSize-height={2048}
                />

                <FollowCam target={myPos} />

                <EnvironmentFloor receiveShadow scale={12} />

                {/* Zombies */}
                {Object.entries(zombies).map(([id, z]) => (
                    <AnimatedFBX
                        key={id}
                        url="/models/zombie.fbx"
                        scale={0.025}
                        position={z}
                        rotation={[0, z.rotation || 0, 0]}
                    />
                ))}

                {/* Other players */}
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

                {/* You */}
                <AnimatedFBX
                    url="/models/run.fbx"
                    scale={0.01}
                    position={myPos}
                    rotation={rotation}
                />

                {/* Items */}
                {Object.entries(items).map(([id, it]) => (
                    <ItemModel key={id} item={it} />
                ))}
            </Canvas>
        </>
    );
}
