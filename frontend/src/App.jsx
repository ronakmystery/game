import { useState } from "react";

import Login from "./components/Login.jsx";
import Log from "./components/Log.jsx";
import Worlds from "./components/Worlds.jsx";
import Game from "./components/Game.jsx";
import GameDev from "./components/GameDev.jsx";

export default function App() {
  const [username, setUsername] = useState("x");
  const [world, setWorld] = useState(null);

  return (
    <div >
      <Log />

      <Login username={username} setUsername={setUsername} />
      <Worlds username={username} setWorld={setWorld} />
      {/* <Game username={username} world={world} /> */}
      <GameDev username={username} />
    </div>
  );
}
