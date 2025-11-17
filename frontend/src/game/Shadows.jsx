import { useRef, useState } from "react";
export default function Shadows() {
    const dir = useRef();

    return (
        <directionalLight
            ref={dir}
            castShadow
            position={[40, 80, 40]}
            intensity={0.6}     // base world light
            shadow-mapSize-width={4096}
            shadow-mapSize-height={4096}

            shadow-camera-left={-120}
            shadow-camera-right={120}
            shadow-camera-top={120}
            shadow-camera-bottom={-120}
            shadow-camera-near={1}
            shadow-camera-far={200}
        />
    );
}
