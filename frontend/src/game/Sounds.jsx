import { useEffect, useRef } from "react";

export default function GameSounds({ zombies, hp, isRunning }) {

    const breathingRef = useRef(null);
    const runningRef = useRef(null);
    const zombieGrowlRef = useRef(null);
    const zombieTimerRef = useRef(null);

    // -----------------------------------------------------------
    // INITIALIZE ALL SOUNDS ONCE
    // -----------------------------------------------------------
    useEffect(() => {
        breathingRef.current = new Audio("/sounds/breathing.mp3");
        breathingRef.current.loop = true;
        breathingRef.current.volume = 0.5;

        runningRef.current = new Audio("/sounds/running.mp3");
        runningRef.current.loop = true;
        runningRef.current.volume = 0;

        zombieGrowlRef.current = new Audio("/sounds/zombie.mp3");
        zombieGrowlRef.current.volume = 0.1;

        // Start playback after user interaction
        const start = () => {
            breathingRef.current?.play().catch(() => { });
            runningRef.current?.play().catch(() => { });
            window.removeEventListener("click", start);
            window.removeEventListener("keydown", start);
        };

        window.addEventListener("click", start);
        window.addEventListener("keydown", start);

        return () => {
            breathingRef.current?.pause();
            runningRef.current?.pause();
            clearTimeout(zombieTimerRef.current);
        };
    }, []);

    // -----------------------------------------------------------
    // PLAYER BREATHING (5 LEVELS)
    // -----------------------------------------------------------
    useEffect(() => {
        if (!breathingRef.current) return;

        let level = 1;
        if (hp < 90) level = 2;
        if (hp < 70) level = 3;
        if (hp < 50) level = 4;
        if (hp < 30) level = 5;

        // CLEAN 5-STEP VOLUME SCALE
        const volumeMap = {
            1: 0.50,   // calm
            2: 0.60,   // slightly heavy
            3: 0.70,   // moderate
            4: 0.85,   // heavy
            5: 1.00    // panic
        };

        const rateMap = {
            1: 0.90,
            2: 1.00,
            3: 1.05,
            4: 1.10,
            5: 1.20
        };

        breathingRef.current.volume = volumeMap[level];
        breathingRef.current.playbackRate = rateMap[level];

    }, [hp]);


    // -----------------------------------------------------------
    // PLAYER RUNNING SOUND
    // -----------------------------------------------------------
    useEffect(() => {
        if (!runningRef.current) return;

        if (isRunning) {
            runningRef.current.volume = 0.05;
            runningRef.current.playbackRate = .8;
        } else {
            runningRef.current.volume = 0;
        }
    }, [isRunning]);

    // -----------------------------------------------------------
    // ZOMBIE RANDOM SOUND ENGINE
    // -----------------------------------------------------------
    useEffect(() => {
        clearTimeout(zombieTimerRef.current);

        const count = zombies.length;
        if (count === 0) return;

        // More zombies → more frequent sound
        const min = Math.max(800, 12000 / count);
        const max = Math.max(1500, 18000 / count);
        const delay = Math.random() * (max - min) + min;

        zombieTimerRef.current = setTimeout(() => {
            if (!zombieGrowlRef.current) return;

            zombieGrowlRef.current.currentTime = 0;

            // Slight random pitch variation
            zombieGrowlRef.current.playbackRate =
                0.9 + Math.random() * 0.3;

            zombieGrowlRef.current.play().catch(() => { });
        }, delay);

        return () => clearTimeout(zombieTimerRef.current);
    }, [zombies.length]);

    return null;
}
