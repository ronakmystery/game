import { Html, useGLTF, useAnimations } from "@react-three/drei";
import { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";

export default function Players({ players, meUsername }) {
    const glb = useGLTF("/models/player.glb");

    return Object.entries(players)
        .filter(([username]) => username !== meUsername)
        .filter(([_, p]) => p.alive)
        .map(([username, p]) => <PlayerModel key={username} username={username} data={p} glb={glb} />);
}

function PlayerModel({ username, data, glb }) {
    const ref = useRef();

    // Clone with skeleton fix
    const cloned = useMemo(() => SkeletonUtils.clone(glb.scene), [glb.scene]);

    const { actions } = useAnimations(glb.animations, ref);

    useEffect(() => {
        const run = actions["CharacterArmature|Run"];
        if (run) {
            run.reset().fadeIn(0.3).play();
        } else {
            console.warn("RUN ANIMATION NOT FOUND");
        }

        return () => {
            if (actions["CharacterArmature|Run"]) {
                actions["CharacterArmature|Run"].fadeOut(0.3);
            }
        };
    }, [actions]);

    useEffect(() => {
        if (!ref.current) return;

        const dx = data.dx ?? 0;
        const dy = data.dy ?? 0;

        // If player is standing still → do not rotate
        if (dx === 0 && dy === 0) return;

        // convert movement vector into rotation (face direction of movement)
        const targetRot = Math.atan2(dx, -dy);

        // smooth rotate
        const curr = ref.current.rotation.y;
        ref.current.rotation.y = curr + (targetRot - curr) * 0.2;
    }, [data.dx, data.dy]);


    return (
        <group ref={ref} position={[data.x, 0, -data.y]} scale={[1, 1, 1]}>
            <primitive object={cloned} />

            <Html center position={[0, 2, 0]}>
                <div style={{
                    padding: "2px 6px",
                    background: "rgba(0,0,0,0.5)",
                    color: "white",
                    borderRadius: "4px",
                    fontSize: "12px"
                }}>
                    {username}
                </div>
            </Html>
        </group>
    );
}
