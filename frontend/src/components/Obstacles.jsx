// components/Obstacles.jsx
import { useGLTF } from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";
import { useMemo, useRef } from "react";

export default function Obstacles({ obstacles }) {

    const treeGLB = useGLTF("/models/tree.glb");
    const rockGLB = useGLTF("/models/rock.glb");

    const baseTree = useMemo(() => SkeletonUtils.clone(treeGLB.scene), [treeGLB]);
    const baseRock = useMemo(() => SkeletonUtils.clone(rockGLB.scene), [rockGLB]);

    // store per-obstacle random data
    const dataRef = useRef({});  // i → {type, scale}

    return obstacles?.map((ob, i) => {

        // Generate data ONCE
        if (!dataRef.current[i]) {

            const isTree = Math.random() < 0.7;

            // size ranges
            const treeScale = Math.random() * 0.015 + 0.008; // 0.008 — 0.023
            const rockScale = Math.random() * .5 + 1.5;     // 0.4 — 0.9

            dataRef.current[i] = {
                type: isTree ? "tree" : "rock",
                scale: isTree
                    ? [treeScale, treeScale, treeScale]
                    : [rockScale, rockScale, rockScale]
            };
        }

        const { type, scale } = dataRef.current[i];
        const model = type === "tree"
            ? SkeletonUtils.clone(baseTree)
            : SkeletonUtils.clone(baseRock);

        return (
            <group
                key={i}
                position={[ob.x, 0, -ob.y]}
                scale={scale}
            >
                <primitive object={model} />
            </group>
        );
    });
}
