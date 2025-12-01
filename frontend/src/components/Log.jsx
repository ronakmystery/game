import { useEffect } from "react";

export default function Log() {

    async function fetchAll() {
        try {
            // ONLINE USERS
            const online = await (await fetch("http://10.226.221.105:8000/current_users")).json();
            console.log("Online Users:", online.current_users || []);

            // WORLDS
            const worlds = await (await fetch("http://10.226.221.105:8000/worlds")).json();
            console.log("Worlds:", worlds || {});

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

        </div>
    );
}
