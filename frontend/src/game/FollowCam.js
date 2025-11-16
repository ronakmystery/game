import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

export default function FollowCam({ target }) {
    const camRef = useRef();

    useFrame(({ camera }) => {
        if (!target) return;

        const desired = [
            target.x,
            target.y + 15,      // height above
            target.z + 30       // distance behind
        ];

        // Smooth camera movement (lerp)
        camera.position.lerp(
            { x: desired[0], y: desired[1], z: desired[2] },
            0.1                // 0.1 = smooth, 1.0 = instant
        );

        camera.lookAt(target.x, target.y, target.z);
    });

    return null;
}
