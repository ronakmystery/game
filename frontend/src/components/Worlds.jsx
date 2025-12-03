import { useState, useEffect } from "react";

const IP = "10.226.221.155"
export default function Worlds({ username, setWorld }) {
    const [worlds, setWorlds] = useState({});
    const [joined, setJoined] = useState(null);
    const [created, setCreated] = useState(null);
    const [error, setError] = useState("");


    // Fetch available worlds
    async function loadWorlds() {
        try {
            const res = await fetch(`http://${IP}:8000/worlds`);
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
                `http://${IP}:8000/join_world?username=${username}&world_name=${wName}`,
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
                `http://${IP}:8000/create_world`,
                { method: "POST" }
            );
            const json = await res.json();
            setCreated(json);
        } catch {
            setError("Failed to create world");
        }
    }

    return (
        <div id="worlds">


            <h2>World Browser</h2>


            <button onClick={createWorld}>Create New World</button>


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


        </div>
    );
}
