// src/hooks/useShoot.js
import * as THREE from "three";

export default function useShoot(ws, me) {

    function fireBullet() {
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        if (!me?.alive) return;
        if (me.ammo <= 0) return;

        const cam = window.__CAMERA;
        if (!cam) return;

        // Get forward vector (projected on ground plane)
        const forward = new THREE.Vector3();
        cam.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        // Send ONLY the vector to server (server handles bullet logic)
        ws.send(JSON.stringify({
            type: "shoot",
            fx: forward.x,
            fy: -forward.z
        }));
    }

    return { fireBullet };
}
