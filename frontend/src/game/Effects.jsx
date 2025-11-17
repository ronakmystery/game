// effects.js
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";


// ----------------------------------------------------
// HEAL EFFECT (green burst + particles)
// ----------------------------------------------------
export function HealEffect({ pos, onDone }) {
    const ref = useRef();
    const particles = useRef([]);
    const [life, setLife] = useState(1); // fades 1 → 0

    // create particles (8 small spheres)
    if (particles.current.length === 0) {
        for (let i = 0; i < 8; i++) {
            particles.current.push({
                x: (Math.random() - 0.5) * 1,
                y: Math.random() * 1,
                z: (Math.random() - 0.5) * 1,
                speed: 0.02 + Math.random() * 0.03,
            });
        }
    }

    useFrame(() => {
        setLife(l => {
            const n = l - 0.03;
            if (n <= 0) {
                onDone && onDone(); // effect done
            }
            return n;
        });
    });

    return (
        <group ref={ref}
            position={[pos.x, pos.y + 1.0, pos.z]}>

            {/* particles */}
            {particles.current.map((p, i) => (
                <mesh
                    key={i}
                    position={[p.x, p.y + (2 - life), p.z]}
                    scale={0.1}
                >
                    <sphereGeometry args={[1, 8, 8]} />
                    <meshBasicMaterial color="#44ff88" transparent opacity={life} />
                </mesh>
            ))}
        </group>
    );
}


// ----------------------------------------------------
// BOMB EXPLOSION (red shockwave + flash)
// ----------------------------------------------------
export function BombEffect({ pos, onDone }) {
    const shockRef = useRef();
    const flashRef = useRef();
    const [life, setLife] = useState(1);

    useFrame(() => {
        setLife(l => {
            const n = l - 0.04;
            if (n <= 0) {
                onDone && onDone();
            }
            return n;
        });
    });

    const size = (1 - life) * 6; // shockwave expands

    return (
        <group position={[pos.x, pos.y + 2, pos.z]}>
            {/* shockwave */}
            <mesh ref={shockRef} rotation={[-Math.PI / 2, 0, 0]} scale={size}>
                <ringGeometry args={[0.5, 1, 32]} />
                <meshBasicMaterial
                    color="red"
                    transparent
                    opacity={life}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* flash (fast) */}
            {life > 0.7 && (
                <mesh ref={flashRef} scale={3}>
                    <sphereGeometry args={[0.5, 16, 16]} />
                    <meshBasicMaterial
                        color="#ff2222"
                        transparent
                        opacity={life}
                    />
                </mesh>
            )}
        </group>
    );
}

