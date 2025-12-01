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

    /* -----------------------------------------------------
       RENDER
    ----------------------------------------------------- */
    return (
        <div style={{ height: "400px" }}>

            {gameState?.players?.[username] && (
                <HealthBar hp={gameState.players[username].hp} />
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
                        <group key={i} position={[z.x, 1, -z.y]}>
                            <mesh>
                                <boxGeometry args={[1, 1, 1]} />
                                <meshStandardMaterial color="green" />
                            </mesh>

                            {/* HP BAR */}
                            <Html center>
                                <ZombieHP hp={z.hp} max={z.max_hp} />
                            </Html>
                        </group>
                    )
                )}

            </Canvas>

            {/* JOYSTICK (disabled when dead) */}
            {me?.alive && (
                <>
                    <Joystick onMove={sendMove} />
                    <button
                        onClick={() => {
                            const ws = wsRef.current;
                            if (!ws || ws.readyState !== WebSocket.OPEN) return;

                            const cam = window.__CAMERA;
                            if (!cam) return;

                            // get forward vector
                            const f = new THREE.Vector3();
                            cam.getWorldDirection(f);
                            f.y = 0;        // keep horizontal only
                            f.normalize();

                            ws.send(JSON.stringify({
                                type: "shoot",
                                fx: f.x,
                                fy: -f.z      // convert to your 2D coordinate system
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
                            fontWeight: "bold",
                            zIndex: 9999,
                        }}
                    >
                        FIRE
                    </button>



                </>)}

        </div>
    )
}