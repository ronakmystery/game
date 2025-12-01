import * as THREE from "three";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

export default function Gun() {
    const ref = useRef();

    useFrame(({ camera }) => {
        if (!ref.current) return;

        // Camera world position
        const camPos = new THREE.Vector3();
        camera.getWorldPosition(camPos);

        // Camera forward direction
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.normalize();

        // Right vector from camera orientation
        const right = new THREE.Vector3();
        camera.getWorldDirection(right);
        right.set(-right.z, 0, right.x).normalize();

        // Up vector
        const up = new THREE.Vector3(0, 1, 0);

        // ⭐ PERFECT RIGHT-HAND OFFSET ⭐
        const gunOffset = new THREE.Vector3()
            .addScaledVector(right, 0.35)    // right side
            .addScaledVector(up, -0.15)      // slightly down
            .addScaledVector(forward, 0.25); // forward from face

        const finalPos = camPos.clone().add(gunOffset);

        ref.current.position.copy(finalPos);
        ref.current.quaternion.copy(camera.quaternion);
    });

    return (
        <mesh ref={ref}>
            <boxGeometry args={[0.25, 0.15, 0.8]} />
            <meshStandardMaterial color="orange" />
        </mesh>
    );
}
