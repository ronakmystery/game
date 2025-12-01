import { useState, useEffect } from "react";

export default function Worlds({ username, setWorld }) {
    const [worlds, setWorlds] = useState({});
    const [joined, setJoined] = useState(null);
    const [created, setCreated] = useState(null);
    const [error, setError] = useState("");


    // Fetch available worlds
    async function loadWorlds() {
        try {
            const res = await fetch("http://10.226.221.105:8000/worlds");
            const json = await res.json();
            setWorlds(json || {});
        } catch {
            console.log("Error fetching worlds");
        }
    }

    useEffect(() => {
        loadWorlds();
        const t = setInterval(loadWorlds, 2000);
        return () => clearInterval(t);
    }, []);

    // JOIN WORLD
    async function join(wName) {
        setError("");

        try {
            const res = await fetch(
                `http://10.226.221.105:8000/join_world?username=${username}&world_name=${wName}`,
                { method: "POST" }
            );
            const json = await res.json();
            setJoined(json);
            setWorld(json);

        } catch {
            setError("Failed to join world");
        }
    }



    // CREATE WORLD
    async function createWorld() {
        setError("");

        try {
            const res = await fetch(
                "http://10.226.221.105:8000/create_world",
                { method: "POST" }
            );
            const json = await res.json();
            setCreated(json);
        } catch {
            setError("Failed to create world");
        }
    }

    return (
        <div style={{ padding: 20 }}>


            <h2>World Browser</h2>

            <div style={{ marginBottom: 10 }}>
                Logged in as: <b>{username || "??"}</b>
            </div>

            <button onClick={createWorld}>Create New World</button>

            {error && (
                <div style={{ color: "red", marginTop: 10 }}>{error}</div>
            )}

            <h3 style={{ marginTop: 20 }}>Available Worlds</h3>

            <ul>
                {Object.entries(worlds).map(([wName, w]) => (
                    <li key={wName} style={{ marginBottom: 10 }}>
                        <b>{wName}</b> — players: {w.players.join(", ") || "none"}
                        <br />
                        port: {w.port}
                        <br />

                        <button
                            onClick={() => join(wName)}
                            style={{ marginTop: 5 }}
                        >
                            Join
                        </button>
                    </li>
                ))}
            </ul>

            {joined && (
                <div style={{ marginTop: 20 }}>
                    <h3>Joined {joined.world_name || joined.world_id}</h3>
                    <div>HTTP: {joined.http_url}</div>
                    <div>WS: {joined.ws_url}</div>
                </div>
            )}

            {created && (
                <div style={{ marginTop: 20 }}>
                    <h3>Created {created.world_name}</h3>
                    <div>HTTP: {created.http_url}</div>
                    <div>WS: {created.ws_url}</div>
                </div>
            )}
        </div>
    );
}
