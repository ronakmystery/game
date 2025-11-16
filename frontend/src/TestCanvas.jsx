// TestCanvas.jsx
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Environment } from "@react-three/drei";

export default function TestCanvas({ children }) {
    return (
        <div style={{
            width: "100vw",
            height: "100vh",
            background: "#101010"
        }}>
            <Canvas camera={{ position: [4, 3, 6], fov: 50 }}>
                {/* Lighting */}
                <ambientLight intensity={0.6} />
                <directionalLight position={[10, 10, 5]} intensity={1} />

                {/* Controls */}
                <OrbitControls enablePan enableRotate enableZoom />

                {/* Ground Grid */}
                <Grid
                    infiniteGrid
                    cellColor="#333"
                    sectionColor="#555"
                    fadeDistance={30}
                    fadeStrength={1}
                />

                {/* Skybox / HDRI */}
                <Environment preset="sunset" />

                {/* Whatever you're testing */}
                {children}
            </Canvas>
        </div>
    );
}
