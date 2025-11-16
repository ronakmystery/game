// AnimatedFBX.jsx
import { useLoader, useFrame } from "@react-three/fiber";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { useMemo, useEffect, useRef } from "react";
import { AnimationMixer } from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils";

export default function AnimatedFBX({
    url,
    scale = 0.01,
    animationSpeed = 1,
    position = { x: 0, y: 0, z: 0 },
    rotation = [0, 0, 0],
    visible = true
}) {
    const original = useLoader(FBXLoader, url);
    const model = useMemo(() => clone(original), [original]);

    const mixer = useRef(null);

    useEffect(() => {
        if (!model) return;



        // Enable shadows on all meshes inside the FBX
        model.traverse(obj => {
            if (obj.isMesh) {
                obj.castShadow = true;
                obj.receiveShadow = true;
            }
        });
        // Create a mixer for THIS copy only
        mixer.current = new AnimationMixer(model);

        if (model.animations?.length > 0) {
            const action = mixer.current.clipAction(model.animations[0]);
            action.reset().play();
        }

        return () => {
            if (mixer.current) {
                mixer.current.stopAllAction();
                mixer.current = null;
            }
        };
    }, [model]);

    useFrame((_, delta) => {
        if (visible && mixer.current) {
            mixer.current.update(delta * animationSpeed);
        }
    });

    return (
        <group position={[position.x, position.y, position.z]} rotation={rotation} visible={visible}>
            <primitive object={model} scale={scale} />
        </group>
    );
}
