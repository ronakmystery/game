import { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import FollowCam from "./game/FollowCam";

import nipplejs from "nipplejs";


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

    // Handle WS messages
    useEffect(() => {
        ws.onmessage = evt => {
            const msg = JSON.parse(evt.data);

            if (msg.type === "state") {
                setPlayers(msg.players || {});
                if (msg.players[pid]) {
                    setMyPos(msg.players[pid]);
                }
            }
        };

        ws.onclose = () => {
            if (heartbeat.current)
                clearInterval(heartbeat.current);
            setSession(null);
        };
    }, [ws, pid]);

    // Movement
    useEffect(() => {
        function handleKey(e) {
            if (!["w", "a", "s", "d"].includes(e.key)) return;

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
                    top: "20px",
                    left: "20px",
                    width: "150px",
                    height: "150px",
                    zIndex: 10
                }}>
            </div>


            <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
                <ambientLight intensity={1} />
                <directionalLight position={[10, 20, 10]} />

                {/* FOLLOW CAMERA */}
                <FollowCam target={myPos} />

                {/* Ground */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
                    <planeGeometry args={[200, 200]} />
                    <meshStandardMaterial color="#555" />
                </mesh>

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
