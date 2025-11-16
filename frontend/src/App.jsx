import { useState } from "react";
import JoinWorld from "./JoinWorld";
import Game from "./Game";

export default function App() {
    const [session, setSession] = useState(null);

    if (!session) {
        return <JoinWorld onJoin={setSession} />;
    }

    return (
        <Game
            pid={session.pid}
            ws={session.ws}
            heartbeat={session.heartbeat}
            username={session.username}
        />
    );
}
