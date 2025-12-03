import { Html, useGLTF, useAnimations } from "@react-three/drei";
import { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";

function ZombieHP({ hp, max }) {
    const pct = Math.max(0, hp / max);
    return (
        <div style={{
            width: "20px",
            height: "1px",
            background: "red",
            borderRadius: "3px",
            overflow: "hidden",
        }}>
            <div style={{
                width: `${pct * 100}%`,
                height: "100%",
                background: pct > 0.3 ? "lime" : "red"
            }} />
        </div>
    );
}

function Zombie({ data }) {
    const ref = useRef();

    const gltf = useGLTF("/models/zombie.glb");

    // fix animation names
    const fixedAnimations = useMemo(() =>
        gltf.animations.map(c => {
            const clip = c.clone();
            clip.name = c.name.split("|").pop();
            return clip;
        }),
        [gltf.animations]
    );

    const clonedScene = useMemo(() => SkeletonUtils.clone(gltf.scene), [gltf.scene]);
    const { actions } = useAnimations(fixedAnimations, ref);

    // choose walk anim once
    const moveAnim = useMemo(() => {
        const choices = ["Walk", "Walk2"];
        return choices[Math.floor(Math.random() * choices.length)];
    }, []);

    // play walk animation ONCE
    useEffect(() => {
        actions?.[moveAnim]?.reset().play();
    }, [actions, moveAnim]);

    // rotate zombie toward camera
    useEffect(() => {
        if (!ref.current) return;

        const cam = window.__CAMERA;
        if (!cam) return;

        const zombiePos = new THREE.Vector3(data.x, 0, -data.y);
        const camPos = cam.position.clone();

        const targetRot = Math.atan2(
            camPos.x - zombiePos.x,
            camPos.z - zombiePos.z
        );

        const curr = ref.current.rotation.y;
        ref.current.rotation.y = curr + (targetRot - curr) * 0.15;
    });

    return (
        <group ref={ref} position={[data.x, 0, -data.y]} scale={0.4}>
            <primitive object={clonedScene} />
            <Html center distanceFactor={12} position={[0, 5, 0]}>
                <ZombieHP hp={data.hp} max={data.max_hp} />
            </Html>
        </group >
    );
}

export default function Zombies({ zombies }) {
    return zombies.map((z, i) =>
        z.alive ? <Zombie key={i} data={z} /> : null
    );
}
