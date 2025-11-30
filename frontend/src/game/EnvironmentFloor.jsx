import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useMemo } from "react";

export default function EnvironmentFloor({ scale = 1, position = [0, 0, 0], rotation = [0, 0, 0] }) {
    const { scene } = useGLTF("/models/grass.glb");

    // Extract biggest mesh once
    const bigMesh = useMemo(() => {
        let biggest = null;

        scene.traverse((obj) => {
            if (obj.isMesh) {
                // Let mesh cast and receive shadows
                obj.castShadow = false;
                obj.receiveShadow = true;

                // Must enable shadow + blended transparency
                obj.material.transparent = true;
                obj.material.alphaTest = 0.3;
                obj.material.side = THREE.DoubleSide;

                // IMPORTANT: Keep depthWrite ON so shadows render
                obj.material.depthWrite = true;

                // select largest mesh
                if (
                    !biggest ||
                    obj.geometry.attributes.position.count >
                    biggest.geometry.attributes.position.count
                ) {
                    biggest = obj;
                }
            }
        });

        return biggest ?? scene;
    }, [scene]);

    // Hide the whole scene
    scene.visible = false;

    // Ensure selected mesh is shown
    if (bigMesh) {
        bigMesh.visible = true;
    }

    return (
        <primitive
            rotation={rotation}
            object={bigMesh}
            position={position}
            scale={scale}
        />
    );
}
