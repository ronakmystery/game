import { useState } from "react";

import Login from "./components/Login.jsx";
import Lobby from "./Lobby.jsx";

import "./App.css";
import Leaderboard from "./components/Leaderboard.jsx";
export default function App() {
  // const [username, setUsername] = useState(`${Math.random().toString(36).substring(2, 8)}`);
  const [username, setUsername] = useState("x");
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
