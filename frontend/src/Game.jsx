import { useState, useEffect } from "react";
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
    const [myPos, setMyPos] = useState({ x: 0, y: 0.5, z: 0 });
    const [hp, setHp] = useState(100);


    const [zombies, setZombies] = useState({});

    // Handle WS messages
    useEffect(() => {
        ws.onmessage = evt => {
            const msg = JSON.parse(evt.data);

            if (msg.type === "state") {
                setPlayers(msg.players || {});
                setZombies(msg.zombies || {});
                if (msg.players[pid]) {
                    setMyPos(msg.players[pid]);
                    setHp(msg.players[pid].hp);

                }
            }
        };

        ws.onclose = () => {
            if (heartbeat.current)
                clearInterval(heartbeat.current);
            setSession(null);
        };
    }, [ws, pid]);

    const MAX_RADIUS = 50;   // match backend radius

    function insideCircle(x, z) {
        return (x * x + z * z) <= (MAX_RADIUS * MAX_RADIUS);
    }



    // Movement
    useEffect(() => {
        function handleKey(e) {
            if (!["w", "a", "s", "d"].includes(e.key)) return;

            let nx = myPos.x;
            let nz = myPos.z;
            // Block movement OUTSIDE circle
            if (!insideCircle(nx, nz)) return;

            ws.send(JSON.stringify({
                type: "move",
                pid,
                key: e.key
            }));
        }

        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [ws, pid]);

    // Joystick movement (for phone)
    useEffect(() => {
        const zone = document.getElementById("joystick-zone");

        const manager = nipplejs.create({
            zone: zone,
            mode: "dynamic",
            color: "white",
        });

        manager.on("move", (evt, data) => {
            if (!data?.direction) return;
            const dir = data.direction.angle; // up / down / left / right

            let key = null;
            if (dir === "up") key = "w";
            if (dir === "down") key = "s";
            if (dir === "left") key = "a";
            if (dir === "right") key = "d";

            let nx = myPos.x;
            let nz = myPos.z;
            // Block movement OUTSIDE circle
            if (!insideCircle(nx, nz)) return;

            if (key) {
                ws.send(JSON.stringify({
                    type: "move",
                    pid,
                    key
                }));
            }
        });

        return () => manager.destroy();
    }, [ws, pid]);


    return (
        <>
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
                }}>
            </div>

            <div style={{
                position: "fixed",
                top: 20,
                left: 20,
                fontSize: 24,
                color: "green",
                zIndex: 10
            }}>
                HP: {hp}
            </div>



            <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
                <ambientLight intensity={1} />
                <directionalLight position={[10, 20, 10]} />

                <WorldBoundary radius={50} />


                {/* FOLLOW CAMERA */}
                <FollowCam target={myPos} />

                {/* Ground */}
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

                {/* Other players */}
                {Object.entries(players).map(([id, p]) => {
                    if (id == pid) return null;
                    return <PlayerSphere key={id} pos={p} />;
                })}

                {/* You */}
                <PlayerSphere pos={myPos} />
            </Canvas>
        </>

    );

}
