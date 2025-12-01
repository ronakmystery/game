import { useEffect, useState } from "react";

export default function Log() {
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [worlds, setWorlds] = useState({});

    async function fetchAll() {
        try {

            // ONLINE USERS
            const online = await (await fetch("http://10.226.221.105:8000/current_users")).json();
            setOnlineUsers(online.current_users || []);  // <---- FIX

            // WORLDS
            const w = await (await fetch("http://10.226.221.105:8000/worlds")).json();
            setWorlds(w || {});            // <---- FIX

        } catch (err) {
            console.error("Fetch error:", err);
        }
    }

    useEffect(() => {
        fetchAll();
        const t = setInterval(fetchAll, 1000);
        return () => clearInterval(t);
    }, []);

    return (
        <div style={{ padding: 20, fontFamily: "sans-serif" }}>
            <h2>System Log</h2>



            <h3>Online Users</h3>
            <ul>
                {onlineUsers.map(u => (
                    <li key={u}>{u}</li>
                ))}
            </ul>

            <h3>Worlds</h3>
            <ul>
                {Object.entries(worlds).map(([wid, w]) => (
                    <li key={wid}>
                        <b>World {wid}</b> — port: {w.port}, container: {w.container}
                        <br />
                        Players: {(w.players || []).join(", ")}
                    </li>
                ))}
            </ul>
        </div>
    );
}
