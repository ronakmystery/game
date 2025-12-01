import { useState, useEffect } from "react";

export default function Login({ username, setUsername }) {
    const [password, setPassword] = useState("");
    const [output, setOutput] = useState("");
    const [loggedIn, setLoggedIn] = useState(false);
    const [heartbeatInterval, setHeartbeatInterval] = useState(null);

    async function doLogin() {
        const res = await fetch(
            `http://10.226.221.105:8000/login?username=${username}&password=${password}`,
            { method: "POST" }
        );

        const json = await res.json();
        setOutput(JSON.stringify(json, null, 2));

        // If login was ok or auto-register, start heartbeat
        if (json.status === "ok" || json.status === "registered") {
            setLoggedIn(true);
            startHeartbeat(username);
        }
    }

    function startHeartbeat(user) {
        // Avoid double intervals
        if (heartbeatInterval) return;

        const interval = setInterval(async () => {
            try {
                await fetch(
                    `http://10.226.221.105:8000/heartbeat?username=${user}`,
                    { method: "POST" }
                );
            } catch (err) {
                console.error("Heartbeat failed:", err);
            }
        }, 1000); // every 3 seconds

        setHeartbeatInterval(interval);
    }

    // Cleanup on unmount (stop heartbeat)
    useEffect(() => {
        return () => {
            if (heartbeatInterval) clearInterval(heartbeatInterval);
        };
    }, [heartbeatInterval]);

    return (
        <div id="login">

            {!loggedIn && (
                <>
                    <input
                        placeholder="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <br />

                    <input
                        type="password"
                        placeholder="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <br />

                    <button onClick={doLogin}>Login</button>
                </>
            )}

            {loggedIn && <p style={{ color: "lightgreen" }}>Logged in as {username}</p>}

            <pre>{output}</pre>
        </div>
    );
}
