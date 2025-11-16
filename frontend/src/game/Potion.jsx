export default function Potion({ pos }) {
    return (
        <mesh position={[pos.x, pos.y, pos.z]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial color="cyan" emissive="cyan" emissiveIntensity={2} />
        </mesh>
    );
}
