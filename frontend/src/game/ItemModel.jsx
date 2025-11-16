import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";

export default function ItemModel({ item }) {
    const ref = useRef();

    // -------------------------------
    //  Per-item config + fallback
    // -------------------------------
    const config = useMemo(() => {
        const table = {
            heal: {
                model: "/models/potion.glb",
                scale: [10, 10, 10],
                yOffset: 2,
            },
            bomb: {
                model: "/models/bomb.glb",
                scale: [.01, .01, .01],
                yOffset: 2,
            },
        };

        // fallback
        return (
            table[item.type] || {
                model: "/models/default.glb",
                scale: [1, 1, 1],
                yOffset: 0.5,
            }
        );
    }, [item.type]);

    // DEBUG

    // Load model
    const gltf = useGLTF(config.model);
    const scene = gltf.scene.clone();  // important: avoid scale overwriting shared cache

    // Apply scale (correct vector)
    scene.scale.set(...config.scale);

    useFrame((_, dt) => {
        if (ref.current) {
            ref.current.rotation.y += dt * 1.2;

            ref.current.position.y =
                config.yOffset + Math.sin(Date.now() * 0.003) * 0.1;
        }
    });

    return (
        <primitive
            ref={ref}
            object={scene}
            position={[item.x, 0.5, item.z]}
        />
    );
}
