import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";

export default function Loot({ item }) {
    const ref = useRef();

    // Load models
    const healthGLB = useGLTF("/models/health.glb");
    const ammoGLB = useGLTF("/models/ammo.glb");

    const healthModel = useMemo(() => healthGLB.scene.clone(), [healthGLB.scene]);
    const ammoModel = useMemo(() => ammoGLB.scene.clone(), [ammoGLB.scene]);

    // float + spin
    useFrame((state) => {
        if (!ref.current) return;
        ref.current.position.y =
            0.3 + Math.sin(state.clock.elapsedTime * 4) * 0.07;
        ref.current.rotation.y += 0.01;
    });

    return (
        <group ref={ref} position={[item.x, 0.3, -item.y]}>
            {item.type === "health" ? (
                <primitive object={healthModel} scale={0.5} />
            ) : (
                <primitive object={ammoModel} scale={3} />
            )}
        </group>
    );
}
