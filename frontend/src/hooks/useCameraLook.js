// src/hooks/useCameraLook.js
import { useEffect } from "react";

export default function useCameraLook(me) {
    useEffect(() => {
        if (!me?.alive) return;

        let dragging = false;
        let lastX = 0;

        const down = (e) => {
            dragging = true;
            lastX = e.clientX || e.touches?.[0]?.clientX;
        };

        const up = () => (dragging = false);

        const move = (e) => {
            if (!dragging) return;
            const cam = window.__CAMERA;
            if (!cam) return;

            const x = e.clientX || e.touches?.[0]?.clientX;
            const dx = x - lastX;
            lastX = x;

            cam.rotation.y -= dx * 0.01;
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
    }, [me?.alive]);
}
