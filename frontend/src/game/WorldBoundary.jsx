export default function WorldBoundary({ radius }) {
    const points = [];

    for (let i = 0; i <= 128; i++) {
        const angle = (i / 128) * Math.PI * 2;
        points.push([Math.cos(angle) * radius, 0.05, Math.sin(angle) * radius]);
    }

    return (
        <line>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={points.length}
                    array={new Float32Array(points.flat())}
                    itemSize={3}
                />
            </bufferGeometry>
            <lineBasicMaterial color="yellow" linewidth={2} />
        </line>
    );
}
