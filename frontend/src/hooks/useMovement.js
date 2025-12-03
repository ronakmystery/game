// src/hooks/useMovement.js
import * as THREE from "three";

export default function useMovement(ws, me) {
    return function sendMove(x, y) {
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        if (!me?.alive) return;
        const cam = window.__CAMERA;
        if (!cam) return;

        const forward = new THREE.Vector3();
        cam.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        const right = new THREE.Vector3(forward.z, 0, -forward.x);

        const moveVec = new THREE.Vector3();
        moveVec.addScaledVector(forward, y);
        moveVec.addScaledVector(right, x);

        ws.send(JSON.stringify({
            type: "move",
            x: moveVec.x,
            y: -moveVec.z,
        }));
    };
}
