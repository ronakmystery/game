import { use, useState } from "react";

import Login from "./components/Login.jsx";
import Lobby from "./Lobby.jsx";

import "./App.css";
import Leaderboard from "./components/Leaderboard.jsx";


import { useGLTF } from "@react-three/drei";

// At top-level (not inside a component)
useGLTF.preload("/models/zombie.glb");
useGLTF.preload("/models/health.glb");
useGLTF.preload("/models/ammo.glb");
useGLTF.preload("/models/tree.glb");
useGLTF.preload("/models/rock.glb");
useGLTF.preload("/models/player.glb");

export default function App() {
  // const [username, setUsername] = useState(`${Math.random().toString(36).substring(2, 8)}`);
  const [username, setUsername] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  return (
    <div id="screen">

      {!loggedIn && (
        <div className="login-stack">
          <Login
            username={username}
            setUsername={setUsername}
            loggedIn={loggedIn}
            setLoggedIn={setLoggedIn}
          />

          <Leaderboard />
        </div>
      )}

      {loggedIn && (
        <div className="lobby-fullscreen">
          <Lobby username={username} />
        </div>
      )}

    </div>
  );

}
