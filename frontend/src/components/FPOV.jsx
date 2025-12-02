import { useFrame } from "@react-three/fiber";

export default function FirstPersonCam({ player }) {
    useFrame(({ camera }) => {
        if (!player?.alive) return;

        const px = player.x;
        const py = -player.y;

        camera.position.set(px, 1.3, py);

        camera.rotation.x = 0;
        camera.rotation.z = 0;

        window.__CAMERA = camera;
    });

    return null;
}
