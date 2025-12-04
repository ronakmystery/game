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
        if (created === "pending") return; // prevent spam
        setError("");
        setCreated("pending");

        try {
            const res = await fetch(
                `http://${IP}:8000/create_world`,
                { method: "POST" }
            );


            const json = await res.json();

            setTimeout(() => {
                setCreated(json);

            }, 1000);
        } catch {
            setError("Failed to create world");
        }
    }


    return (
        <div id="world-browser">

            <div className="crt-overlay"></div>


            <button
                className={`wb-btn ${created === "pending" ? "creating" : ""}`}
                onClick={createWorld}
                disabled={created === "pending"}
            >
                {created === "pending" ? "CREATING..." : "CREATE NEW WORLD"}
            </button>

            <h3 className="wb-sub">Available Worlds</h3>

            <ul className="wb-list">
                {Object.entries(worlds).map(([wName, w]) => (
                    <li className="wb-item" key={wName}>
                        <div className="wb-name">{wName}</div>

                        <div className="wb-info">
                            <div>Players: {w.players.join(", ") || "none"}</div>
                            <div>Port: {w.port}</div>
                        </div>

                        <button
                            className="wb-join"
                            disabled={w.players.length >= 7}
                            onClick={() => join(wName)}
                        >
                            {w.players.length >= 7 ? "FULL" : "JOIN"}
                        </button>

                    </li>
                ))}
            </ul>

        </div>
    );

}
