import { useState, useEffect } from "react";
import JoinWorld from "./JoinWorld";
import Game from "./Game";

import { preloadAllModels } from "./game/PreloadModels";

export default function App() {
    const [session, setSession] = useState(null);

    // Hook ALWAYS runs → safe
    useEffect(() => {
        preloadAllModels();
        console.log("Preloading models...");
    }, []);

    // Conditional rendering happens AFTER all hooks
    if (!session) {
        return <JoinWorld onJoin={setSession} />;
    }

    return (
        <Game
            pid={session.pid}
            ws={session.ws}
            setSession={setSession}
            heartbeat={session.heartbeat}
            username={session.username}
        />
    );
}
