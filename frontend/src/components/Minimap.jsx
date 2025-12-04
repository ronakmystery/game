import React from "react";

export default function Minimap({ me, players, zombies, obstacles }) {
    const size = 70;
    const arena = 25;      // world radius from your circleGeometry args

    const scale = size / (arena * 2); // world → minimap conversion

    // Convert world coords to minimap coords
    const mapXY = (wx, wy) => ({
        x: wx * scale + size / 2,
        y: -wy * scale + size / 2,
    });

    return (
        <div style={{
            position: "absolute",
            bottom: 10,
            left: 10,
            opacity: 0.7,
            width: size,
            height: size,
            borderRadius: "50%",
            border: "1px solid white",
            background: "rgba(0,0,0,0.4)",
            overflow: "hidden",
            zIndex: 999,
        }}>
            {/* All players including me */}
            {players && Object.values(players).filter(p => p.alive).map((p, i) => {
                const { x, y } = mapXY(p.x, p.y);

                const isMe = p.username === me?.username;

                return (
                    <div
                        key={i}
                        style={{
                            position: "absolute",
                            width: isMe ? 6 : 6,
                            height: isMe ? 6 : 6,
                            background: isMe ? "cyan" : "white", // highlight yourself
                            borderRadius: "50%",
                            left: x - (isMe ? 6 : 4),
                            top: y - (isMe ? 6 : 4),
                        }}
                    />
                );
            })}



            {/* Obstacles (optional) */}
            {/* {obstacles?.map((o, i) => {
                const { x, y } = mapXY(o.x, o.y);
                return (
                    <div key={i} style={{
                        position: "absolute",
                        width: 4,
                        height: 4,
                        background: "gray",
                        borderRadius: "50%",
                        left: x - 2,
                        top: y - 2,
                    }} />
                );
            })} */}
            {/* Zombies */}
            {zombies?.filter(z => z.alive).map((z, i) => {
                const { x, y } = mapXY(z.x, z.y);
                return (
                    <div key={i} style={{
                        position: "absolute",
                        width: 4,
                        height: 4,
                        background: "red",
                        borderRadius: "50%",
                        left: x - 4,
                        top: y - 4,
                    }} />
                );
            })}

        </div>
    );
}
