import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function Bomb({ pos }) {
    const ref = useRef();

    // Spin + float animation
    useFrame((state) => {
        if (!ref.current) return;
        const t = state.clock.getElapsedTime();

        ref.current.rotation.y = t * 2;  // spin
        ref.current.position.y = pos.y + Math.sin(t * 3) * 0.15; // float
    });

    return (
        <mesh ref={ref} position={[pos.x, pos.y, pos.z]} castShadow receiveShadow>
            {/* Simple bomb shape: sphere + fuse */}
            <sphereGeometry args={[0.35, 32, 32]} />
            <meshStandardMaterial
                color="#333333"
                metalness={0.3}
                roughness={0.4}
            />

            {/* Glow Fuse */}
            <mesh position={[0, 0.55, 0]}>
                <sphereGeometry args={[0.1, 16, 16]} />
                <meshStandardMaterial
                    color="#ff6600"
                    emissive="#ff3300"
                    emissiveIntensity={1.5}
                />
            </mesh>

            {/* Fuse stick */}
            <mesh position={[0, 0.4, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 0.3, 8]} />
                <meshStandardMaterial color="#444" />
            </mesh>
        </mesh>
    );
}
