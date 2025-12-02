import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRef, useEffect, useState } from "react";
import Joystick from "./Joystick";

import HealthBar from "./HealthBar";
import { Html } from "@react-three/drei";
import ZombieHP from "./ZombieHP";
import Gun from "./Gun";


/* -----------------------------------------------------
   FIRST PERSON CAMERA (only active when alive)
----------------------------------------------------- */
function FirstPersonCam({ player }) {
    useFrame(({ camera }) => {
        if (!player?.alive) return;

        const px = player.x;
        const py = -player.y;

        // Move camera to head
        camera.position.set(px, 1.3, py);

        // CLEAN camera orientation after OrbitControls messed it up
        camera.rotation.x = 0;   // no up/down tilt yet
        camera.rotation.z = 0;   // keep horizon level

        // Save camera state for movement
        window.__CAMERA = camera;
    });

    return null;
}

function LootItem({ item }) {
    const ref = useRef();

    useFrame((state) => {
        if (!ref.current) return;

        // bounce up/down
        ref.current.position.y =
            0.3 + Math.sin(state.clock.elapsedTime * 4) * 0.07;

        // spin
        ref.current.rotation.y += 0.05;
    });

    return (
        <group ref={ref} position={[item.x, 0.3, -item.y]}>
            {item.type === "health" ? (
                <mesh>
                    <boxGeometry args={[0.4, 0.4, 0.4]} />
                    <meshStandardMaterial
                        color="red"
                        emissive="red"
                        emissiveIntensity={0.4}
                    />
                </mesh>
            ) : (
                <mesh>
                    <sphereGeometry args={[0.3, 16, 16]} />
                    <meshStandardMaterial
                        color="yellow"
                        emissive="yellow"
                        emissiveIntensity={0.4}
                    />
                </mesh>
            )}
        </group>
    );
}

function BulletVisual({ origin, dir, speed = 0.4, onDone }) {
    const ref = useRef();

    useFrame(() => {
        if (!ref.current) return;

        ref.current.position.x += dir.x * speed;
        ref.current.position.z += dir.z * speed;

        // if too far → remove
        if (ref.current.position.length() > 20) {
            onDone();
        }
    });

    return (
        <mesh ref={ref} position={[origin.x, 1.1, origin.z]}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color="yellow" emissive="yellow" emissiveIntensity={1} />
        </mesh>
    );
}


export default function Game3D({ username }) {
    const WS_URL = "ws://10.226.221.105:8001/ws";

    const wsRef = useRef(null);
    const [gameState, setGameState] = useState(null);

    /* -----------------------------------------------------
       WEBSOCKET CONNECT
    ----------------------------------------------------- */
    useEffect(() => {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
            ws.send(JSON.stringify({ type: "join", username }));
        };

        ws.onmessage = evt => {
            const data = JSON.parse(evt.data);
            if (data.type === "state") setGameState(data.game);
        };

        return () => ws.close();
    }, [username]);

    /* -----------------------------------------------------
       SCREEN DRAG TO ROTATE (FPS LOOK)
       Only when alive (in first person)
    ----------------------------------------------------- */
    const me = gameState?.players?.[username];
    const amDead = me && !me.alive;

    useEffect(() => {
        if (amDead) return; // dead → orbit mode handles rotation

        let dragging = false;
        let lastX = 0;

        const down = e => {
            dragging = true;
            lastX = e.clientX || e.touches?.[0].clientX;
        };

        const up = () => (dragging = false);

        const move = e => {
            if (!dragging || amDead) return;

            const camera = window.__CAMERA;
            if (!camera) return;

            const x = e.clientX || e.touches?.[0].clientX;
            const dx = x - lastX;
            lastX = x;

            // rotate camera horizontally
            camera.rotation.y -= dx * 0.01;
        };

        window.addEventListener("mousedown", down);
        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", up);

        window.addEventListener("touchstart", down);
        window.addEventListener("touchmove", move);
        window.addEventListener("touchend", up);

        return () => {
            window.removeEventListener("mousedown", down);
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", up);

            window.removeEventListener("touchstart", down);
            window.removeEventListener("touchmove", move);
            window.removeEventListener("touchend", up);
        };
    }, [amDead]);

    /* -----------------------------------------------------
       MOVEMENT USING REAL CAMERA QUATERNION
       TRUE FORWARD/RIGHT movement
    ----------------------------------------------------- */
    function sendMove(x, y) {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) return;

        const me = gameState?.players?.[username];

        if (!me || !me.alive) {
            // dead → no movement
            return;
        }

        const camera = window.__CAMERA;
        if (!camera) return;

        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        const right = new THREE.Vector3(forward.z, 0, -forward.x);

        const moveVec = new THREE.Vector3();
        moveVec.addScaledVector(forward, y);
        moveVec.addScaledVector(right, x);

        ws.send(JSON.stringify({
            type: "move",
            x: moveVec.x,
            y: -moveVec.z
        }));
    }

    const [localBullets, setLocalBullets] = useState([]);


    /* -----------------------------------------------------
       RENDER
    ----------------------------------------------------- */
    return (
        <div style={{ height: "400px" }}>

            {gameState?.players?.[username] && (
                <HealthBar hp={gameState.players[username].hp} />
            )}

            {me?.alive && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 20,
                        left: 20,
                        padding: "8px 14px",
                        background: "rgba(0, 0, 0, 0.5)",
                        color: "white",
                        fontSize: "22px",
                        borderRadius: "6px",
                        zIndex: 9999,
                        border: "2px solid rgba(255,255,255,0.3)"
                    }}
                >
                    Ammo: {me.ammo ?? 0}
                </div>
            )}

            {gameState && (
                <div
                    style={{
                        position: "absolute",
                        top: 10,
                        left: "50%",
                        transform: "translateX(-50%)",
                        padding: "6px 12px",
                        background: "rgba(0,0,0,0.5)",
                        color: "white",
                        fontSize: "22px",
                        borderRadius: "6px",
                        zIndex: 9999,
                        border: "2px solid rgba(255,255,255,0.25)"
                    }}
                >
                    Round {gameState.round}
                </div>
            )}


            <Canvas
                camera={{ position: [0, 1.3, 0], fov: 60 }}
                style={{ width: "100%", height: "100%", background: "grey" }}
            >
                <ambientLight intensity={0.4} />
                <directionalLight position={[5, 10, 5]} intensity={1} />



                {/* ALIVE → FIRST PERSON CAMERA */}
                {me?.alive && (
                    <>
                        <FirstPersonCam player={me} />
                        <Gun />
                    </>


                )}

                {/* DEAD → ORBITAL SPECTATOR CAMERA */}
                {!me?.alive && (
                    <OrbitControls
                        enablePan={true}
                        enableZoom={true}
                        enableRotate={true}

                        // starting view direction
                        target={[0, 1, 0]}

                        // starting angle & zoom
                        minPolarAngle={Math.PI / 4}   // 45° from top
                        minDistance={15}
                    />

                )}

                {/* GROUND */}
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[30, 30]} />
                    <meshStandardMaterial color="#222" />
                </mesh>

                {/* PLAYER MODEL (only shown when dead) */}
                {!me?.alive && me && (
                    <mesh position={[me.x, 1, -me.y]}>
                        <boxGeometry args={[1, 1, 1]} />
                        <meshStandardMaterial color="hotpink" />
                    </mesh>
                )}

                {/* OTHER PLAYERS */}
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

                {gameState?.zombies?.map((z, i) =>
                    z.alive && (
                        <group key={`${i}-${z.hp}`} position={[z.x, 1, -z.y]}>
                            <mesh>
                                <boxGeometry args={[1, 1, 1]} />
                                <meshStandardMaterial color="red" />
                            </mesh>

                            <Html center>
                                <ZombieHP hp={z.hp} max={z.max_hp} />
                            </Html>
                        </group>
                    )
                )}



                {/* CLIENT-SIDE BULLETS */}
                {localBullets.map(b =>
                    <BulletVisual
                        key={b.id}
                        origin={b.origin}
                        dir={b.dir}
                        onDone={() =>
                            setLocalBullets(arr => arr.filter(x => x.id !== b.id))
                        }
                    />
                )}

                {/* LOOT VISUALS */}
                {gameState?.loot?.map((item, i) => (
                    <LootItem key={`loot-${i}`} item={item} />
                ))}

                {gameState?.obstacles?.map((ob, i) => (
                    <mesh
                        key={i}
                        position={[ob.x, 0.75, -ob.y]}
                    >
                        <boxGeometry args={[ob.w, ob.h, ob.h]} />
                        <meshStandardMaterial color="green" />
                    </mesh>
                ))}




            </Canvas>

            {/* JOYSTICK (disabled when dead) */}
            {me?.alive && (
                <>
                    <Joystick onMove={sendMove} />
                    <button disabled={!me?.alive || me.ammo <= 0}
                        onClick={() => {
                            const ws = wsRef.current;
                            if (!ws || ws.readyState !== WebSocket.OPEN) return;



                            const camera = window.__CAMERA;

                            // Forward vector
                            const forward = new THREE.Vector3();
                            camera.getWorldDirection(forward);
                            forward.y = 0;
                            forward.normalize();

                            // Right vector
                            const right = new THREE.Vector3();
                            right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

                            // Gun offset
                            const GUN_SIDE_OFFSET = 0.35;
                            const GUN_FORWARD_OFFSET = 0.5;
                            const GUN_HEIGHT_OFFSET = -0.1;

                            const camPos = camera.position.clone();
                            const origin = camPos
                                .clone()
                                .add(right.multiplyScalar(GUN_SIDE_OFFSET))
                                .add(forward.clone().multiplyScalar(GUN_FORWARD_OFFSET));
                            origin.y += GUN_HEIGHT_OFFSET;


                            // Visual spread amount (radians)
                            const SPREAD = 0.1; // small → 1.7 degrees. Increase for more chaos.

                            // random angle inside cone
                            const angle = (Math.random() - 0.5) * SPREAD;

                            // rotate forward vector around Y axis by this random angle
                            const cos = Math.cos(angle);
                            const sin = Math.sin(angle);

                            // rotated direction
                            const visX = forward.x * cos - forward.z * sin;
                            const visZ = forward.x * sin + forward.z * cos;

                            // LOCAL BULLET
                            setLocalBullets(b => [
                                ...b,
                                {
                                    id: Math.random(),
                                    origin: { x: origin.x, y: origin.y, z: origin.z },
                                    dir: { x: visX, z: visZ }
                                }
                            ]);


                            // send to server
                            ws.send(JSON.stringify({
                                type: "shoot",
                                fx: forward.x,
                                fy: -forward.z
                            }));

                        }}

                        style={{
                            position: "absolute",
                            bottom: 40,
                            right: 40,
                            width: 100,
                            height: 100,
                            borderRadius: "50%",
                            background: "rgba(255,0,0,0.7)",
                            color: "white",
                            fontSize: 24,
                            zIndex: 9999
                        }}
                    >
                        FIRE
                    </button>



                </>)}

        </div>
    )
}