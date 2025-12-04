// MiniLeaderboard.jsx
export default function MiniLeaderboard({ players }) {
    // players = [{ username, score, hp, alive }, ...]

    const sorted = [...players]
        .sort((a, b) => b.score - a.score)
        .slice(0, 3); // top 3

    return (
        <div style={styles.box}>
            <div style={styles.title}>LEADERBOARD</div>

            {sorted.map((p, i) => (
                <div key={p.username} style={styles.row}>
                    <span style={styles.rank}>{i + 1}</span>

                    <span style={{
                        ...styles.name,
                        opacity: p.alive ? 1 : 0.4,
                        textDecoration: p.alive ? "none" : "line-through"
                    }}>
                        {p.username}
                    </span>

                    <span style={styles.score}>{p.score}</span>
                </div>
            ))}
        </div>
    );
}

const styles = {
    box: {
        position: "absolute",
        bottom: "20px",
        left: "20px",
        width: "180px",
        background: "rgba(0,0,0,0.45)",
        padding: "10px",
        borderRadius: "8px",
        color: "white",
        fontFamily: "sans-serif",
        fontSize: "13px",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
    },
    title: {
        textAlign: "center",
        fontWeight: "bold",
        marginBottom: "6px",
        letterSpacing: "1px",
        fontSize: "12px",
    },
    row: {
        display: "flex",
        justifyContent: "space-between",
        padding: "3px 0",
    },
    rank: { width: "18px", opacity: 0.7 },
    name: { flexGrow: 1 },
    score: { width: "30px", textAlign: "right" },
};
