// ----------------------------------
// Joystick.js  (NippleJS Component)
// ----------------------------------
import { useEffect, useRef } from "react";
import nipplejs from "nipplejs";

export default function Joystick({ onMove }) {
    const zoneRef = useRef(null);
    const managerRef = useRef(null);

    useEffect(() => {
        if (!zoneRef.current) return;

        // Create joystick
        const manager = nipplejs.create({
            zone: zoneRef.current,
            mode: "static",
            position: { left: "50%", top: "50%" },
            color: "white",
            size: 150,
        });

        managerRef.current = manager;

        // Handle movement
        manager.on("move", (evt, data) => {
            if (!data.vector) return;

            // Normalize movement direction
            const x = data.vector.x;     // -1 to +1
            const y = data.vector.y;    // invert vertical

            onMove(x, y);
        });

        // Stop on release
        manager.on("end", () => {
            onMove(0, 0);
        });

        return () => {
            manager.destroy();
        };
    }, []);

    return (
        <div
            ref={zoneRef}
            style={{
                position: "fixed",
                bottom: "100px",
                left: "50%",
                transform: "translate(-50%, 50%)",
                width: 100,
                height: 100,
                zIndex: 9999,
                background: "black",
                borderRadius: "50%",
                touchAction: "none",
            }}
        />
    );
}
