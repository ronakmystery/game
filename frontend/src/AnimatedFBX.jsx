// AnimatedFBX.jsx
import { useLoader, useFrame } from "@react-three/fiber";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { useMemo, useEffect, useRef } from "react";
import { AnimationMixer } from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils";

import { getFBX } from "./game/ModelCache";

export default function AnimatedFBX({
    url,
    scale = 0.01,
    animationSpeed = 1,
    position = { x: 0, y: 0, z: 0 },
    rotation = [0, 0, 0],
    visible = true
}) {
    // ----------------------------------------------
    // 1. Try cache first
    // ----------------------------------------------
    const cached = getFBX(url);

    // ----------------------------------------------
    // 2. Fall back to loading ONLY if cache empty
    // ----------------------------------------------
    const loaded = useLoader(FBXLoader, cached ? null : url);

    // ----------------------------------------------
    // 3. Pick whichever exists
    // ----------------------------------------------
    const source = cached || loaded;

    // ----------------------------------------------
    // 4. Clone the model so each has its own skeleton
    // ----------------------------------------------
    const model = useMemo(() => clone(source), [source]);

    // Animation mixer
    const mixer = useRef(null);

    useEffect(() => {
        if (!model) return;

        model.traverse(obj => {
            if (obj.isMesh) {
                obj.castShadow = true;
                obj.receiveShadow = true;
            }
        });

        mixer.current = new AnimationMixer(model);

        if (model.animations?.length > 0) {
            const action = mixer.current.clipAction(model.animations[0]);
            action.reset().play();
        }

        return () => {
            if (mixer.current) mixer.current.stopAllAction();
        };
    }, [model]);

    useFrame((_, delta) => {
        if (visible && mixer.current) {
            mixer.current.update(delta * animationSpeed);
        }
    });

    return (
        <group
            position={[position.x, position.y, position.z]}
            rotation={rotation}
            visible={visible}
        >
            <primitive object={model} scale={scale} />
        </group>
    );
}
