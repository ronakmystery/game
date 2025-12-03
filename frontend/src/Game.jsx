import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useState } from "react";


import useGameSocket from "./hooks/useGameSocket";
import useCameraLook from "./hooks/useCameraLook";
import useMovement from "./hooks/useMovement";
import useShoot from "./hooks/useShoot";

import POV from "./components/POV";
import Zombies from "./components/Zombies";
import Loot from "./components/Loot";
import Obstacles from "./components/Obstacles";


import HealthBar from "./components/HealthBar";
import Ammo from "./components/Ammo";
import Round from "./components/Round";
import Joystick from "./components/Joystick";



import Players from "./components/Players";

export default function Game({ username, setWorld, world }) {
    const { gameState, ws, me } = useGameSocket(username, world);
    const { fireBullet } = useShoot(ws, me);
    const sendMove = useMovement(ws, me);
    useCameraLook(me);

    const [prevActive, setPrevActive] = useState(null);
    useEffect(() => {
        if (!gameState) return;

        const active = gameState.round_active;

        // round ended (went from true -> false)
        if (prevActive === true && active === false) {
            alert("Round complete! Next round in 7 seconds!");
        }

        setPrevActive(active);
    }, [gameState]);




    const alive = me?.alive;
    const [recoil, setRecoil] = useState(false);
    const shoot = () => {
        if (me.ammo <= 0) return;

        setRecoil(true);
        fireBullet();

        // reset recoil after animation
        setTimeout(() => setRecoil(false), 120);
    };



    return (
        <div
            id="game"
            style={{ height: "50vh", position: "relative" }}>
            {alive && <HealthBar hp={me.hp} />}
            {alive && <Ammo ammo={me.ammo} />}
            {gameState && <Round round={gameState.round} />}
            {
                alive && <img
                    src="/gun.png"
                    alt="gun"
                    style={{
                        position: "absolute",
                        bottom: "0px",
                        right: "0px",
                        height: "45%",
                        pointerEvents: "none",
                        userSelect: "none",
                        zIndex: 500,
                        transform: recoil ? "scale(1.1)" : "scale(1)",
                        transformOrigin: "center bottom",
                        transition: "transform 0.12s ease-out"
                    }}
                />
            }


            {alive && recoil && (
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        width: "10px",
                        height: "10px",
                        background: "red",
                        borderRadius: "50%",
                        transform: "translate(-50%, -50%)",
                        pointerEvents: "none",
                        zIndex: 500,
                    }}
                />
            )}


            <Canvas
                onClick={shoot}
                camera={{ position: [0, 1.3, 0], fov: 60 }}
                style={{ width: "100%", height: "100%" }}
                onCreated={({ scene }) => {
                    scene.background = new THREE.Color("#050505");   // dark sky
                    scene.fog = new THREE.Fog("#050505", 5, 40);     // fog near, far
                }}
            >
                <ambientLight intensity={1} />
                <directionalLight position={[5, 10, 5]} intensity={1} />

                <Players players={gameState?.players || {}} meUsername={me?.username} />

                {alive && <POV player={me} />}


                {!alive && (
                    <OrbitControls
                        enablePan
                        enableZoom
                        enableRotate
                        minPolarAngle={Math.PI / 4}
                        minDistance={15}
                        target={[0, 1, 0]}
                    />
                )}
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[25, 30]} />  {/* radius 25, 64 segments */}
                    <meshStandardMaterial color="rgb(50, 100, 50)" />
                </mesh>


                <Zombies zombies={gameState?.zombies || []} />
                {gameState?.loot?.map((item, i) => <Loot key={i} item={item} />)}
                <Obstacles obstacles={gameState?.obstacles || []} />


            </Canvas>

            {alive && (
                <div id="controls">
                    <Joystick onMove={sendMove} />

                </div>
            )}

            <button onClick={() => {
                window.location.reload();
            }}>Leave</button>


        </div>
    );
}
