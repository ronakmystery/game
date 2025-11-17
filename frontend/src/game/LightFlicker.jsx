import { useRef } from "react";
import { useFrame } from "@react-three/fiber";


// super simple smooth noise generator
let seed = 0;
function noise(x) {
    seed = (seed + 1) % 100000;
    return Math.sin(x + seed * 0.0001) * 0.5 + 0.5;
}


export default function LightFlicker() {
    const light = useRef();

    useFrame(() => {
        if (!light.current) return;

        const t = performance.now() * 0.00025; // very slow base movement

        // Smooth pulse like a "breathing darkness"
        const pulse = (Math.sin(t * 2) + 1) * 0.5;     // 0 → 1 smooth

        // Random drift, VERY slow, so brightness wanders over time
        const drift = noise(t * 0.5) * 0.4;            // requires noise fn below

        // Combine
        const intensity = 0.15 + pulse * 0.4 + drift * 0.4;

        light.current.intensity = Math.max(0, intensity);
    });

    return (
        <pointLight
            ref={light}
            castShadow
            position={[0, 15, 0]}      // center of map glowing outward
            distance={120}
            decay={2.2}
            intensity={0.5}
            color="#ffffff"
        />
    );
}
