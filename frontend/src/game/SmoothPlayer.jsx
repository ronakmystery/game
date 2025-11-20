// SmoothPlayerCombined.jsx
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import AnimatedFBX from "../AnimatedFBX.jsx";

export default function SmoothPlayer({
    myPos,
    rotation,
    smoothFactor = 0.25   // <--- adjustable factor
}) {
    const ref = useRef();

    const smooth = useRef({
        x: myPos.x,
        y: myPos.y,
        z: myPos.z
    });

    useFrame(() => {
        if (!ref.current) return;

        smooth.current.x += (myPos.x - smooth.current.x) * smoothFactor;
        smooth.current.y += (myPos.y - smooth.current.y) * smoothFactor;
        smooth.current.z += (myPos.z - smooth.current.z) * smoothFactor;

        ref.current.position.set(
            smooth.current.x,
            smooth.current.y,
            smooth.current.z
        );

        ref.current.rotation.y = rotation[1];
    });

    return (
        <group ref={ref}>
            <AnimatedFBX url="/models/run.fbx" scale={0.01} />
        </group>
    );
}
