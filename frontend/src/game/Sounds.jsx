import { useEffect, useRef } from "react";

export default function GameSounds({ hp, isRunning, zombies }) {
    // Local volume multipliers
    const RUN_VOL = 0.05;

    const breatheRef = useRef(null);
    const runRef = useRef(null);

    const z1Ref = useRef(null);
    const z2Ref = useRef(null);
    const z3Ref = useRef(null);

    // INIT SOUNDS
    useEffect(() => {
        breatheRef.current = new Audio("/sounds/breathing.mp3");
        runRef.current = new Audio("/sounds/running.mp3");

        z1Ref.current = new Audio("/sounds/zombie.mp3");
        z2Ref.current = new Audio("/sounds/zombie.mp3");
        z3Ref.current = new Audio("/sounds/zombie.mp3");

        // all loops
        for (let ref of [breatheRef, runRef, z1Ref, z2Ref, z3Ref]) {
            ref.current.loop = true;
        }

        runRef.current.volume = 0;

        // Start after first user interaction
        const start = () => {
            breatheRef.current.play().catch(() => { });
            runRef.current.play().catch(() => { });

            z1Ref.current.play().catch(() => { });
            z2Ref.current.play().catch(() => { });
            z3Ref.current.play().catch(() => { });

            window.removeEventListener("click", start);
            window.removeEventListener("keydown", start);
        };

        // window.addEventListener("click", start);
        // window.addEventListener("keydown", start);
        start();

        return () => {
            breatheRef.current?.pause();
            runRef.current?.pause();
            z1Ref.current?.pause();
            z2Ref.current?.pause();
            z3Ref.current?.pause();
        };
    }, []);

    // BREATHING INTENSITY
    useEffect(() => {
        if (!breatheRef.current) return;

        let lvl = 1;
        if (hp < 90) lvl = 2;
        if (hp < 70) lvl = 3;
        if (hp < 50) lvl = 4;
        if (hp < 30) lvl = 5;

        const volumeMap = {
            1: 0.50,
            2: 0.60,
            3: 0.70,
            4: 0.80,
            5: 0.95
        };

        const rateMap = {
            1: 0.95,
            2: 1.00,
            3: 1.05,
            4: 1.10,
            5: 1.20
        };

        breatheRef.current.volume = volumeMap[lvl];
        breatheRef.current.playbackRate = rateMap[lvl];
    }, [hp]);

    // RUNNING SOUND
    useEffect(() => {
        if (!runRef.current) return;
        runRef.current.volume = isRunning ? RUN_VOL : 0;
        runRef.current.playbackRate = isRunning ? 1.15 : 1.0;
    }, [isRunning]);

    // RANDOM WOBBLE on all loops every 250ms
    useEffect(() => {
        const jitter = setInterval(() => {
            if (!breatheRef.current) return;

            breatheRef.current.volume *= (0.97 + Math.random() * 0.06);
            breatheRef.current.playbackRate *= (0.99 + Math.random() * 0.03);
            z1Ref.current.volume = 0.10 * (0.85 + Math.random() * 0.20);
            z1Ref.current.playbackRate = 0.80 + Math.random() * 0.30;

            z2Ref.current.volume = 0.05 * (0.85 + Math.random() * 0.20);   // FIXED
            z2Ref.current.playbackRate = 0.85 + Math.random() * 0.35;

            z3Ref.current.volume = 0.10 * (0.90 + Math.random() * 0.22);
            z3Ref.current.playbackRate = 0.90 + Math.random() * 0.40;


        }, 250);

        return () => clearInterval(jitter);
    }, []);

    return null;
}
