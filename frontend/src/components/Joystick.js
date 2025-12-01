// Joystick.js
import { useEffect, useRef, useState } from "react";
import nipplejs from "nipplejs/dist/nipplejs.js";

export default function Joystick() {
    const joystickRef = useRef(null);
    const joystickInst = useRef(null);

    const [pos, setPos] = useState({ x: 0, y: 0 });      // continuous position
    const [dir, setDir] = useState({ x: 0, y: 0, force: 0 }); // current direction

    // init nipple.js
    useEffect(() => {
        if (joystickInst.current) return;

        const joystick = nipplejs.create({
            zone: joystickRef.current,
            mode: "dynamic",
            color: "white",
            size: 120
        });

        joystickInst.current = joystick;

        joystick.on("move", (evt, data) => {
            if (!data.vector) return;
            setDir({ x: data.vector.x, y: data.vector.y, force: data.force });
        });

        joystick.on("end", () => {
            setDir({ x: 0, y: 0, force: 0 });
        });

        return () => joystick.destroy();
    }, []);

    // movement loop
    useEffect(() => {
        const base = 0.2;

        const t = setInterval(() => {
            if (dir.force > 0) {
                const speed = base * dir.force;
                setPos(prev => ({
                    x: prev.x + dir.x * speed,
                    y: prev.y + dir.y * speed,
                }));
            }
        }, 16);

        return () => clearInterval(t);
    }, [dir]);

    return { pos, dir, joystickRef };
}
