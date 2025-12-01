import { useEffect, useState } from "react";

export default function Game({ username, world }) {
    const [ws, setWS] = useState(null);
    const [state, setState] = useState(null);
    const [chatText, setChatText] = useState("");

    // ------------------------------------------
    // CONNECT WS WHEN world.ws_url ARRIVES
    // ------------------------------------------
    useEffect(() => {
        if (!world) return;

        const socket = new WebSocket(world.ws_url);

        socket.onopen = () => {
            socket.send(
                JSON.stringify({
                    type: "join",
                    username
                })
            );
        };

        socket.onmessage = (msg) => {
            let data = JSON.parse(msg.data);
            if (data.type === "state") setState(data.game);
        };

        socket.onclose = () => console.log("WS closed");

        setWS(socket);

        return () => socket.close();
    }, [world]);


    // ------------------------------------------
    // MOVEMENT CONTROLS
    // ------------------------------------------
    useEffect(() => {
        if (!ws) return;

        function handleKey(e) {
            let x = 0, y = 0;

            if (e.key === "ArrowUp") y = 1;
            if (e.key === "ArrowDown") y = -1;
            if (e.key === "ArrowLeft") x = -1;
            if (e.key === "ArrowRight") x = 1;

            if (x !== 0 || y !== 0) {
                ws.send(
                    JSON.stringify({
                        type: "move",
                        x,
                        y
                    })
                );
            }
        }

        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [ws]);


    // ------------------------------------------
    // SEND CHAT
    // ------------------------------------------
    function sendChat() {
        if (!ws) return;
        ws.send(JSON.stringify({ type: "chat", text: chatText }));
        setChatText("");
    }


    if (!world) return <div>Join a world first.</div>;
    if (!state) return <div>Connecting to world...</div>;

    return (
        <div style={{ padding: 20 }}>
            <h2>World: {world.world_name}</h2>

            <div>
                <h3>Players</h3>
                <ul>
                    {Object.entries(state.players).map(([name, p]) => (
                        <li key={name}>
                            {name}: x={p.x}, y={p.y}
                        </li>
                    ))}
                </ul>
            </div>


        </div>
    );
}
