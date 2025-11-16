import { Html } from '@react-three/drei';

export default function NameTag({ text }) {
    return (
        <Html
            center
            position={[0, 2.2, 0]}
            style={{
                color: "white",
                fontSize: "14px",
                background: "rgba(0,0,0,0.6)",
                padding: "2px 6px",
                borderRadius: "4px",
                whiteSpace: "nowrap",
                pointerEvents: "none",
            }}
        >
            {text}
        </Html>
    );
}
