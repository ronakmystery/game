import { useGLTF, useAnimations } from "@react-three/drei";
import { useEffect } from "react";

export default function ZombieGLB({ url = "/models/zombie.glb", animation = "Walk", ...props }) {
    const gltf = useGLTF(url);
    const { actions } = useAnimations(gltf.animations, gltf.scene);

    useEffect(() => {
        if (actions[animation]) {
            actions[animation].reset().fadeIn(0.3).play();
        }
        return () => {
            if (actions[animation]) actions[animation].fadeOut(0.3);
        };
    }, [animation]);

    return (
        <primitive
            object={gltf.scene}
            {...props}
        />
    );
}

useGLTF.preload("/models/zombie.glb");
