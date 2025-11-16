import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

export default function ItemModel({ item }) {
    const ref = useRef();

    useFrame((_, dt) => {
        if (ref.current) {
            ref.current.rotation.y += dt * 1.5;
            ref.current.position.y = 0.5 + Math.sin(Date.now() * 0.003) * 0.1;
        }
    });

    const color =
        item.type === "heal" ? "lime" :
            item.type === "bomb" ? "red" :
                "white";

    return (
        <mesh ref={ref} position={[item.x, 0.5, item.z]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={1.2}
            />
        </mesh>
    );
}
