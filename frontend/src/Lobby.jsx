import { useEffect, useState } from "react";
import Game from "./Game";
import Worlds from "./components/Worlds.jsx";
import Leaderboard from "./components/Leaderboard.jsx";
export default function Lobby({ username }) {
    const [world, setWorld] = useState(null);

    // ------------------------------------------
    // IF WORLD EXISTS → LOAD GAME
    // ------------------------------------------
    if (world) {
        return <Game username={username} setWorld={setWorld} world={world} />;
    }

    // ------------------------------------------
    // OTHERWISE SHOW LOBBY SCREEN
    // ------------------------------------------
    return (
        <div id="lobby">

            <h1>Welcome, {username}!</h1>


            <Worlds username={username} setWorld={setWorld} />

            {!world && <Leaderboard />}


        </div >
    );
}
