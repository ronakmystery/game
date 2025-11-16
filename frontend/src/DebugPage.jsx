// DebugPage.jsx
import { useState } from "react";
import TestCanvas from "./TestCanvas.jsx";
import AnimatedFBX from "./AnimatedFBX.jsx";

export default function DebugPage() {
    const [mode, setMode] = useState("stand");

    const toggle = () => {
        setMode(m => (m === "stand" ? "run" : "stand"));
    };

    return (
        <>
            {/* Toggle Button */}
            <div
                style={{
                    position: "fixed",
                    top: 20,
                    left: 20,
                    zIndex: 100
                }}
            >
                <button
                    onClick={toggle}
                    style={{ padding: "10px", fontSize: "18px" }}
                >
                    Toggle Mode: {mode}
                </button>
            </div>

            <TestCanvas>
                {/* PRELOAD BOTH MODELS */}
                <AnimatedFBX
                    url="/models/stand.fbx"
                    scale={0.01}
                    visible={mode === "stand"}
                />

                <AnimatedFBX
                    url="/models/run.fbx"
                    scale={0.01}
                    visible={mode === "run"}
                />
            </TestCanvas>
        </>
    );
}
