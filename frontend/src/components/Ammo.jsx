export default function Ammo({ ammo }) {
    return (
        <div style={{
            position: "absolute",
            bottom: 10,
            right: 10,
            padding: "8px 14px",
            background: "rgba(0, 0, 0, 0.5)",
            color: "white",
            fontSize: "12px",
            borderRadius: "6px",
            zIndex: 9999,
            border: "2px solid rgba(255,255,255,0.3)"
        }}>
            {ammo}
        </div>
    );
}
