import { use, useState } from "react";

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
      {
        username && <div>Logged in as: {username}</div>
      }

      {
        !username && <><Login username={username} setUsername={setUsername} />
          <Worlds username={username} setWorld={setWorld} />
        </>
      }


      {/* <Game username={username} world={world} /> */}
      <GameDev username={username} />
    </div>
  );
}
