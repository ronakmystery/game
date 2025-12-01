export default function ZombieHP({ hp, max }) {
    const pct = Math.max(0, hp / max);

    return (
        <div
            style={{
                position: "absolute",
                transform: "translate(-50%, -40px)",
                width: "30px",
                height: "4px",
                background: "rgba(0,0,0,0.5)",
            }}
        >
            <div
                style={{
                    width: `${pct * 100}%`,
                    height: "100%",
                    background: "lime",
                }}
            ></div>
        </div>
    );
}
