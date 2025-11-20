import { useGLTF } from "@react-three/drei";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { setFBX } from "./ModelCache";

export function preloadAllModels() {
    // ------- GLB -------
    useGLTF.preload("/models/bomb.glb");
    useGLTF.preload("/models/floor.glb");
    useGLTF.preload("/models/potion.glb");

    // ------- FBX -------
    const loader = new FBXLoader();

    loader.load("/models/zombie.fbx", model => setFBX("zombie", model));
    loader.load("/models/run.fbx", model => setFBX("run", model));
}
