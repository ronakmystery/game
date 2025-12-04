// MiniLeaderboard.jsx
export default function Scores({ gameState }) {
    const round = gameState?.round ?? 1;

    const sorted = [...Object.values(gameState?.players || {})]
        .sort((a, b) => b.score - a.score)
        .slice(0, 7);

    return (
        <div style={styles.box}>

            {/* ROUND IN TOP RIGHT */}
            <div style={styles.round}>Round {round}</div>

            <div style={styles.title}>PLAYERS</div>

            {sorted.map((p, i) => (
                <div key={p.username} style={styles.row}>
                    <span style={styles.rank}>{i + 1}</span>

                    <span
                        style={{
                            ...styles.name,
                            opacity: p.alive ? 1 : 0.4,
                            textDecoration: p.alive ? "none" : "line-through"
                        }}
                    >
                        {p.username}
                    </span>

                    <div style={styles.hpBox}>
                        <div
                            style={{
                                ...styles.hpBar,
                                width: `${p.hp}%`,
                                background:
                                    p.hp > 60
                                        ? "lime"
                                        : p.hp > 30
                                            ? "yellow"
                                            : "red",
                            }}
                        />
                    </div>

                    <span style={styles.score}>{p.score} K</span>

                </div>
            ))}
        </div>
    );
}

const styles = {
    box: {
        position: "absolute",
        top: "10px",
        right: "10px",
        width: "140px",
        background: "rgba(0,0,0,0.45)",
        padding: "10px",
        borderRadius: "8px",
        color: "white",
        fontFamily: "sans-serif",
        fontSize: "8px",
        zIndex: 9999,
        backdropFilter: "blur(4px)",
    },

    round: {
        position: "absolute",
        top: "4px",
        right: "6px",
        fontSize: "10px",
        opacity: 0.8,
        fontWeight: "bold",
    },

    title: {
        fontWeight: "bold",
        marginTop: "10px",
        marginBottom: "6px",
        fontSize: "8px",
        letterSpacing: "1px",
    },
    row: {
        display: "flex",
        alignItems: "center",
        gap: "2px",
        padding: "2px 0",
    },
    rank: { width: "10px", opacity: 0.7 },
    name: { flexGrow: 1, overflow: "hidden", textOverflow: "ellipsis" },
    score: { width: "20px", textAlign: "right", opacity: 0.9 },

    hpBox: {
        width: "30px",
        height: "2px",
        background: "rgba(255,255,255,0.15)",
        borderRadius: "3px",
        position: "relative",
        overflow: "hidden",
    },
    hpBar: {
        height: "100%",
        borderRadius: "3px",
    },
};

