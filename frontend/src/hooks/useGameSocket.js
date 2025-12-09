// src/hooks/useGameSocket.js
import { useEffect, useRef, useState } from "react";

export default function useGameSocket(username, world) {
    const WS_URL = world.ws_url;
    const wsRef = useRef(null);
    const [gameState, setGameState] = useState(null);

    useEffect(() => {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
            ws.send(JSON.stringify({ type: "join", username }));
        };

        ws.onmessage = (evt) => {
            const data = JSON.parse(evt.data);
            if (data.type === "state") {
                setGameState(data.game);
            }
        };

        return () => ws.close();
    }, [username]);

    const me = gameState?.players?.[username] || null;

    return {
        gameState,
        ws: wsRef.current,
        me,
    };
}
