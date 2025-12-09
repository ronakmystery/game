import { useEffect, useRef, useState } from "react";

export default function HealthBar({ hp }) {
    const pct = Math.max(0, Math.min(100, hp || 0));

    const [flash, setFlash] = useState(null); // "damage" or "heal"
    const prevHp = useRef(pct);

    useEffect(() => {
        if (pct < prevHp.current) {
            setFlash("damage");
        } else if (pct > prevHp.current) {
            setFlash("heal");
        }
        prevHp.current = pct;

        const t = setTimeout(() => setFlash(null), 200);
        return () => clearTimeout(t);
    }, [pct]);

    return (
        <div style={{
            position: "absolute",
            top: 10,
            left: 10,
            width: 180,
            height: 8,
            borderRadius: 10,
            overflow: "hidden",
            background: "red",
            zIndex: 9999,
            boxShadow:
                flash === "damage" ? "0 0 12px 4px rgba(255,0,0,0.7)" :
                    flash === "heal" ? "0 0 12px 4px rgba(0,255,0,0.7)" :
                        "none",
            transition: "box-shadow 0.15s ease-out"
        }}>
            <div
                style={{
                    width: `${pct}%`,
                    height: "100%",
                    background: pct > 50 ? "#0f0" :
                        pct > 20 ? "yellow" : "red",
                    transition: "width 0.1s linear"
                }}
            />
        </div>
    );
}
