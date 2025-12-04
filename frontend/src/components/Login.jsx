import { useState, useEffect } from "react";

const IP = "10.226.221.155";

export default function Login({ username, setUsername, loggedIn, setLoggedIn }) {
    const [password, setPassword] = useState("");
    const [output, setOutput] = useState("");
    const [heartbeatInterval, setHeartbeatInterval] = useState(null);
    const [pending, setPending] = useState(false);

    async function doLogin() {
        if (pending) return; // prevent spam
        setPending(true);
        setOutput("");

        if (username.trim() === "" || password.trim() === "") {
            setOutput("Username and password cannot be empty");
            setPending(false);
            return;
        }
        try {
            const res = await fetch(`http://${IP}:8000/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            const json = await res.json();
            setOutput(JSON.stringify(json, null, 2));

            setTimeout(() => {
                if (json.status === "ok" || json.status === "registered") {
                    console.log("Login successful");
                    setLoggedIn(true);
                    startHeartbeat(username);
                }
                setPending(false);
            }, 800);

        } catch (err) {
            setOutput("Login failed");
            setPending(false);
        }
    }

    function startHeartbeat(user) {
        if (heartbeatInterval) return;

        const interval = setInterval(async () => {
            try {
                await fetch(
                    `http://${IP}:8000/heartbeat?username=${user}`,
                    { method: "POST" }
                );
            } catch (err) {
                console.error("Heartbeat failed:", err);
            }
        }, 1000);

        setHeartbeatInterval(interval);
    }

    useEffect(() => {
        return () => heartbeatInterval && clearInterval(heartbeatInterval);
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

                    <input
                        type="password"
                        placeholder="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <button
                        onClick={doLogin}
                        disabled={pending}
                        className={pending ? "login-btn-pending" : ""}
                    >
                        {pending ? "LOGGING IN..." : "LOGIN"}
                    </button>
                </>
            )}

            {loggedIn && <p style={{ color: "lightgreen" }}>Logged in as {username}</p>}

            <pre>{output ? output : `
Designed and Developed by 
Ronak Mistry + ChatGPT
            
Frontend: [React]

Backend: [Python, MariaDB, Adminer]

Dev:[Vite, Docker]

Server:[Raspberry Pi 5]

            
            `}</pre>
        </div>
    );
}
