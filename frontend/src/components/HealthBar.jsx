export default function HealthBar({ hp }) {
    // clamp 0–100
    const pct = Math.max(0, Math.min(100, hp || 0));

    return (
        <div style={{
            position: "absolute",
            top: 10,
            left: 10,
            width: 180,
            height: 10,
            border: "2px solid #000",
            borderRadius: 10,
            overflow: "hidden",
            background: "red",
            zIndex: 9999
        }}>
            <div
                style={{
                    width: `${pct}%`,
                    height: "100%",
                    background: pct > 50 ? "#0f0" :
                        pct > 20 ? "yellow" : "red",
                    transition: "width 0.1s linear"
                }}
            />
            <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                color: "white",
                fontWeight: "bold",
                textAlign: "center",
                lineHeight: "22px",
                textShadow: "1px 1px 3px #000"
            }}>
            </div>
        </div>
    );
}
