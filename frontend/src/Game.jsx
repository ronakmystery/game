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
import Joystick from "./components/Joystick";



import Players from "./components/Players";
import Scores from "./components/Scores";

import Minimap from "./components/Minimap";

const IP = "10.226.221.155";



export default function Game({ username, setWorld, world }) {
    const { gameState, ws, me } = useGameSocket(username, world);
    const { fireBullet } = useShoot(ws, me);
    const sendMove = useMovement(ws, me);
    useCameraLook(me);



    const [prevActive, setPrevActive] = useState(null);
    useEffect(() => {
        if (!gameState) return;
        // console.log("GameState updated:", gameState);

        const active = gameState.round_active;

        if (prevActive === true && active === false) {
            let timeLeft = 7;
            setNextRoundTimer(timeLeft);

            const interval = setInterval(() => {
                timeLeft -= 1;
                setNextRoundTimer(timeLeft);

                if (timeLeft <= 0) {
                    clearInterval(interval);
                    setNextRoundTimer(null);
                }
            }, 1000);
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




    async function leaveWorld() {
        await fetch(`http://${IP}:8000/leave_world?username=${username}`, {
            method: "POST"
        });

        setWorld(null);
    }

    // useEffect(() => {
    //     if (!me) return;

    //     // player just died
    //     if (me.alive === false) {
    //         setTimeout(() => {
    //             leaveWorld();
    //         }, 10000);
    //     }

    // }, [me]);

    const [nextRoundTimer, setNextRoundTimer] = useState(null);


    return (
        <div
            id="game"
            style={{ height: "50vh", position: "relative" }}>
            {alive && <HealthBar hp={me.hp} />}
            {alive && <Ammo ammo={me.ammo} />}
            {alive && (
                <img
                    src={me.score >= 10 ? "/gun2.png" : "/gun.png"}
                    alt="gun"
                    style={{
                        position: "absolute",
                        bottom: "0px",
                        right: me.score >= 10 ? "-40px" : "0px",

                        height: "45%",
                        pointerEvents: "none",
                        userSelect: "none",
                        zIndex: 500,
                        transform: recoil ? "scale(1.1)" : "scale(1)",
                        transformOrigin: "center bottom",
                        transition: "transform 0.12s ease-out"
                    }}
                />
            )}


            {alive && recoil && (
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        width: "5px",
                        height: "5px",
                        background: "red",
                        borderRadius: "50%",
                        transform: "translate(-50%, -50%)",
                        pointerEvents: "none",
                        zIndex: 500,
                    }}
                />
            )}

            {nextRoundTimer !== null && (
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        padding: "8px 16px",
                        background: "rgba(0,0,0,0.6)",
                        color: "white",
                        fontSize: "10px",
                        fontWeight: "bold",
                        borderRadius: "8px",
                        zIndex: 900
                    }}
                >
                    Next round in {nextRoundTimer}...
                </div>
            )}


            <Minimap
                me={me}
                players={gameState?.players}
                zombies={gameState?.zombies}
                obstacles={gameState?.obstacles}
            />

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
                    <circleGeometry args={[20, 20]} />  {/* radius 25, 64 segments */}
                    <meshStandardMaterial color="rgba(7, 44, 7, 1)" />
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

            {
                !alive && (
                    <div
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            color: "white",
                            fontSize: "100px",
                            fontWeight: "bold",
                            textAlign: "center",
                            textShadow: "2px 2px 5px #000",
                            zIndex: 500,
                            opacity: 0.5
                        }}
                    >
                        💀 <br />
                    </div>
                )
            }
            <Scores gameState={gameState} />


            <button
                id="leave-btn"
                onClick={() => {
                    leaveWorld();
                }}>LEAVE</button>


        </div>
    );
}
