// DebugPage.jsx
import TestCanvas from "./TestCanvas.jsx";
import AnimatedFBX from "./AnimatedFBX.jsx";

import EnvironmentFloor from "./game/EnvironmentFloor.jsx";
export default function DebugPage() {
    return (
        <>
            <TestCanvas>
                <AnimatedFBX
                    url="/models/zombie.fbx"
                    scale={0.01}
                />

                <EnvironmentFloor scale={5} position={[0, -.2, 0]} />
            </TestCanvas>
        </>
    );
}
