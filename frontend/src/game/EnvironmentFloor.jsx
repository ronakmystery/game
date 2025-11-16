import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

export default function EnvironmentFloor({ scale = 1, position = [0, 0, 0] }) {
    const { scene } = useGLTF("/models/floor.glb");

    let bigMesh = null;

    scene.traverse((obj) => {
        if (obj.isMesh) {
            // Enable transparency
            obj.material.transparent = true;
            obj.material.alphaTest = 0.3;
            obj.material.depthWrite = false;
            obj.material.side = THREE.DoubleSide;

            // Identify BIGGEST mesh by vertex count
            if (!bigMesh || obj.geometry?.attributes?.position.count > bigMesh.geometry.attributes.position.count) {
                bigMesh = obj;
            }
        }
    });

    // hide the entire model (root)
    scene.visible = false;

    // show only big mesh
    if (bigMesh) bigMesh.visible = true;

    return (
        <primitive
            object={bigMesh}
            position={position}
            scale={scale}
        />
    );
}
