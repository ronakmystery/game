from fastapi import FastAPI
import time
import docker
import threading

app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # allow any origin (for dev)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from pydantic import BaseModel

class JoinRequest(BaseModel):
    username: str


import socket

def get_host_ip():
    return "10.226.221.105"


client = docker.from_env()

# --- CONFIG ---
WORLD_CAPACITY = 10
WORLD_LIFETIME = 60        # seconds worlds stay alive
PLAYER_TIMEOUT = 3         # seconds until player considered disconnected
BASE_PORT = 20000

# --- STATE ---
worlds = []               # [{id, name, port, players, created_at, container_id}]
players = {}              # {player_id: {"world": id, "last": t}}
world_counter = 0
player_counter = 0


# ------------------ WORLD MANAGEMENT ------------------

def create_world():
    """Create a new world container."""
    global world_counter
    world_counter += 1

    port = BASE_PORT + world_counter
    name = f"world_{world_counter}"

    container = client.containers.run(
        "world:latest",
        name=name,
        detach=True,
        ports={"8000/tcp": port},
    )

    world = {
        "id": world_counter,
        "name": name,
        "port": port,
        "players": 0,
        "created_at": time.time(),
        "container_id": container.id
    }

    worlds.append(world)
    print(f"🟢 Created {name} on port {port}")

    return world


def delete_world(world):
    """Delete a world + its container."""
    try:
        container = client.containers.get(world["container_id"])
        container.remove(force=True)
        print(f"🔴 Deleted expired world {world['name']}")
    except:
        pass


EMPTY_TIMEOUT = 3     # world empty deletion
HARD_EXPIRE = 60      # world lifetime max

def cleanup_expired_worlds():
    now = time.time()
    expired = []

    for w in worlds:

        # 1. Hard expiration (priority 1)
        if now - w["created_at"] >= HARD_EXPIRE:
            expired.append(w)
            continue

        # 2. Early deletion if empty (priority 2)
        if w["players"] == 0:

            # Start empty timer
            if "empty_since" not in w:
                w["empty_since"] = now
                continue

            # If empty long enough → delete
            if now - w["empty_since"] >= EMPTY_TIMEOUT:
                expired.append(w)
                continue
        else:
            # Reset empty timer because players returned
            w.pop("empty_since", None)

    # Perform deletion
    for w in expired:
        delete_world(w)
        worlds.remove(w)




# ------------------ PLAYER MANAGEMENT ------------------

def cleanup_players():
    """Remove disconnected players."""
    now = time.time()
    to_delete = []

    for pid, data in players.items():
        if now - data["last"] > PLAYER_TIMEOUT:
            to_delete.append(pid)

    for pid in to_delete:
        world_id = players[pid]["world"]
        print(f"💀 Player {pid} disconnected from world {world_id}")

        # subtract from world
        for w in worlds:
            if w["id"] == world_id:
                w["players"] -= 1
                break

        del players[pid]


def get_available_world():
    """Return first world that is alive + has space."""
    now = time.time()

    for w in worlds:
        alive = now - w["created_at"] <= WORLD_LIFETIME
        room = w["players"] < WORLD_CAPACITY

        if alive and room:
            return w

    return None


# ------------------ BACKGROUND CLEANER ------------------

def background_cleaner():
    while True:
        cleanup_expired_worlds()
        cleanup_players()
        time.sleep(1)   # run every second


threading.Thread(target=background_cleaner, daemon=True).start()


# ------------------ API ENDPOINTS ------------------
HOST = get_host_ip()

@app.post("/join")
def join(req: JoinRequest):
    global player_counter
    player_counter += 1
    pid = player_counter

    world = get_available_world()
    if world is None:
        world = create_world()
    
    time.sleep(3)

    players[pid] = {
        "username": req.username,
        "world": world["id"],
        "last": time.time()
    }

    world["players"] += 1

    time_left = WORLD_LIFETIME - (time.time() - world["created_at"])
    time_left = max(0, time_left)

    return {
        "player_id": pid,
        "username": req.username,
        "assigned_world": {
            "id": world["id"],
            "name": world["name"],
            "url": f"http://{HOST}:{world['port']}",
            "ws_url": f"ws://{HOST}:{world['port']}/ws?pid={pid}&username={req.username}",
            "port": world["port"],
            "players": world["players"],
            "time_left": time_left
        }
    }


@app.post("/heartbeat/{player_id}")
def heartbeat(player_id: int):
    if player_id in players:
        players[player_id]["last"] = time.time()
    return {"ok": True}


@app.get("/worlds")
def list_worlds():
    """Show world list with expiration info."""
    now = time.time()
    return [
        {
            "id": w["id"],
            "name": w["name"],
            "port": w["port"],
            "players": w["players"],
            "age": round(now - w["created_at"], 2),
            "expires_in": max(0, WORLD_LIFETIME - (now - w["created_at"])),
        }
        for w in worlds
    ]


@app.get("/players")
def list_players():
    """Show active players with world + last seen."""
    now = time.time()
    return [
        {
            "id": pid,
            "world": players[pid]["world"],
            "last_seen": round(now - players[pid]["last"], 2),
            "username": players[pid]["username"]
        }
        for pid in players
    ]


from fastapi.responses import HTMLResponse

@app.get("/debug", response_class=HTMLResponse)
def debug():
    now = time.time()

    html = """
    <html>
    <head>
        <style>
            body { font-family: Arial; padding: 20px; }
            h2 { margin-top: 30px; }
            pre { background: #f0f0f0; padding: 10px; border-radius: 5px; }
            .section { margin-bottom: 40px; }
        </style>

        <script>
            async function refresh() {
                const worlds = await fetch("/worlds").then(r => r.json());
                const players = await fetch("/players").then(r => r.json());

                document.getElementById("worlds").textContent =
                    JSON.stringify(worlds, null, 2);

                document.getElementById("players").textContent =
                    JSON.stringify(players, null, 2);
            }

            setInterval(refresh, 1000);
            window.onload = refresh;
        </script>
    </head>

    <body>

        <div class="section">
            <h2>Active Worlds</h2>
            <pre id="worlds">Loading...</pre>
        </div>

        <div class="section">
            <h2>Active Players</h2>
            <pre id="players">Loading...</pre>
        </div>

    </body>
    </html>
    """

    return HTMLResponse(html)
