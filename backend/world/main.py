import asyncio
import random
import math
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import time
app = FastAPI()

# ------------------------------
# GAME STATE
# ------------------------------

players = {}          # { pid: {"x","y","z","ws","username"} }
zombies = {}          # { zid: {"x","y","z","speed"} }

SPEED = 0.1           # player speed
ZOMBIE_SPEED = 0.02   # zombie movement speed
MAX_RADIUS = 50       # circular boundary for world
NEXT_ZID = 1          # incremental zombie ID


# ------------------------------
# BROADCAST
# ------------------------------
async def broadcast_state():
    state = {
        "type": "state",
        "players": {
            pid: {"x": p["x"], "y": p["y"], "z": p["z"], "hp": p["hp"]}
            for pid, p in players.items()
        },
        "zombies": {
            zid: {"x": z["x"], "y": z["y"], "z": z["z"]}
            for zid, z in zombies.items()
        }
    }

    dead = []

    for pid, p in players.items():
        try:
            await p["ws"].send_json(state)
        except:
            dead.append(pid)

    for pid in dead:
        print(f"Removing dead player {pid}")
        players.pop(pid, None)


# ------------------------------
# PLAYER MOVEMENT
# ------------------------------
def apply_move(pid, key):
    p = players[pid]

    nx = p["x"]
    nz = p["z"]

    if key == "w":
        nz -= SPEED
    elif key == "s":
        nz += SPEED
    elif key == "a":
        nx -= SPEED
    elif key == "d":
        nx += SPEED

    # circle boundary clamp
    dist = math.sqrt(nx * nx + nz * nz)
    if dist <= MAX_RADIUS:
        p["x"] = nx
        p["z"] = nz
    # else: ignore move


# ------------------------------
# ZOMBIE AI
# ------------------------------
def update_zombies():
    if not players:
        return

    for zid, z in zombies.items():

        # find nearest player
        nearest_pid = None
        nearest_d = 999999

        for pid, p in players.items():
            dx = p["x"] - z["x"]
            dz = p["z"] - z["z"]
            d = (dx * dx + dz * dz) ** 0.5

            if d < nearest_d:
                nearest_d = d
                nearest_pid = pid

        if nearest_pid is None:
            continue

        # chase nearest player
        px = players[nearest_pid]["x"]
        pz = players[nearest_pid]["z"]

        dx = px - z["x"]
        dz = pz - z["z"]
        dist = math.sqrt(dx * dx + dz * dz) + 1e-6

        z["x"] += (dx / dist) * ZOMBIE_SPEED
        z["z"] += (dz / dist) * ZOMBIE_SPEED


# ------------------------------
# ZOMBIE SPAWNER
# ------------------------------
async def zombie_spawner():
    global NEXT_ZID

    while True:
        await asyncio.sleep(10)  # every 10 seconds, 1 zombie

        angle = random.random() * 2 * math.pi
        r = MAX_RADIUS - 2

        x = math.cos(angle) * r
        z = math.sin(angle) * r

        zid = NEXT_ZID
        NEXT_ZID += 1

        zombies[zid] = {
            "x": x,
            "y": 0.5,
            "z": z,
            "speed": ZOMBIE_SPEED,
        }

        print(f"🧟 Spawned zombie {zid} at ({x:.1f}, {z:.1f})")
def zombie_damage_check():
    now = time.time()

    for zid, z in zombies.items():
        zx, zz = z["x"], z["z"]

        for pid, p in players.items():
            dx = p["x"] - zx
            dz = p["z"] - zz
            dist = math.sqrt(dx*dx + dz*dz)

            if dist < 1.0:  # touching
                last = p.get("last_hit", 0)

                if now - last > 0.5:  # damage cooldown
                    p["hp"] -= 1
                    p["last_hit"] = now

                    if p["hp"] < 0:
                        p["hp"] = 0


# ------------------------------
# WORLD LOOP (RUNS 100 FPS)
# ------------------------------
async def world_loop():
    while True:
        if players:
            update_zombies()
            zombie_damage_check()
            await broadcast_state()

        await asyncio.sleep(0.01)


# ------------------------------
# STARTUP
# ------------------------------
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(world_loop())
    asyncio.create_task(zombie_spawner())


# ------------------------------
# WEBSOCKET HANDLER
# ------------------------------
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket, pid: int, username: str):
    await ws.accept()

    print(f"🟢 Player joined: {username} (pid={pid})")

    players[pid] = {
        "x": 0,
        "y": 0.5,
        "z": 0,
        "hp": 100,           # ⭐ add health
        "ws": ws,
        "username": username,
    }


    await ws.send_json({
        "type": "welcome",
        "pid": pid,
        "message": f"Welcome {username}!"
    })

    try:
        while True:
            msg = await ws.receive_json()

            if msg["type"] == "move":
                apply_move(msg["pid"], msg["key"])

    except WebSocketDisconnect:
        print(f"🔴 Player disconnected: {username}")
        players.pop(pid, None)

    except Exception as e:
        print("WS ERROR:", e)
        players.pop(pid, None)
