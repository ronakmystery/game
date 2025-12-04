import { useEffect, useRef } from "react";

export default function Ammo({ ammo }) {
    const ref = useRef();
    const last = useRef(ammo);

    useEffect(() => {
        if (!ref.current) return;

        const el = ref.current;

        // detect change
        const diff = ammo - last.current;

        if (diff !== 0) {
            // animation style
            el.style.transition = "transform 0.15s ease, color 0.15s ease";

            if (diff > 0) {
                // gained ammo → yellow pop
                el.style.transform = "scale(1.4)";
                el.style.color = "yellow";
            } else {
                // lost ammo → red pop
                el.style.transform = "scale(0.8)";
                el.style.color = "red";
            }

            // restore smoothly
            setTimeout(() => {
                if (!el) return;
                el.style.transform = "scale(1)";
                el.style.color = "white";
            }, 150);
        }

        last.current = ammo;
    }, [ammo]);

    return (
        <div
            ref={ref}
            style={{
                position: "absolute",
                bottom: 10,
                right: 10,
                padding: "8px 14px",
                background: "rgba(0, 0, 0, 0.5)",
                color: "white",
                fontSize: "12px",
                borderRadius: "6px",
                zIndex: 9999,
                border: "2px solid rgba(255,255,255,0.3)",
                transform: "scale(1)",
                transition: "transform 0.15s ease, color 0.15s ease",
            }}
        >
            {ammo}
        </div>
    );
}
