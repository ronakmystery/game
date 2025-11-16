import asyncio
import random
import math
import time
from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI()

# ------------------------------
# GAME STATE
# ------------------------------

players = {}        # pid → {"x","y","z","hp","ws","username","last_hit"}
zombies = {}        # zid → {"x","y","z"}
NEXT_ZID = 1

SPEED = 0.1
ZOMBIE_SPEED = 0.02
MAX_RADIUS = 30

# ------------------------------
# ROUND TIMER SYSTEM
# ------------------------------
ROUND_TIME = 63       # total time per round
PLAY_TIME = 60        # active gameplay
round_start = time.time()
phase = "play"        # "play" or "results"
winner_pid = None

WAIT_TIME = 3        # wait before play begins


# ------------------------------
# BROADCAST STATE
# ------------------------------
async def broadcast_state():
    now = time.time()
    remaining = max(0, ROUND_TIME - (now - round_start))

    state = {
        "type": "state",
        "phase": phase,
        "timer": remaining,
        "winner": winner_pid,

        "players": {
            pid: {"x": p["x"], "y": p["y"], "z": p["z"], "hp": p["hp"], "username": p["username"]}
            for pid, p in players.items()
        },

        "zombies": {
            zid: {"x": z["x"], "y": z["y"], "z": z["z"]}
            for zid, z in zombies.items()
        }
    }

    dead_ws = []
    for pid, p in players.items():
        try:
            await p["ws"].send_json(state)
        except:
            dead_ws.append(pid)

    for pid in dead_ws:
        print(f"Removing disconnected player {pid}")
        players.pop(pid, None)


# ------------------------------
# PLAYER MOVEMENT
# ------------------------------
def apply_move(pid, key):
    if phase != "play":  
        return  # movement frozen

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

    # Keep inside circle
    if math.sqrt(nx * nx + nz * nz) <= MAX_RADIUS:
        p["x"] = nx
        p["z"] = nz


# ------------------------------
# ZOMBIE AI
# ------------------------------
def update_zombies():
    if not players:
        return

    for zid, z in zombies.items():
        nearest_pid = None
        nearest_dist = 999999

        for pid, p in players.items():
            dx = p["x"] - z["x"]
            dz = p["z"] - z["z"]
            dist = math.sqrt(dx*dx + dz*dz)

            if dist < nearest_dist:
                nearest_dist = dist
                nearest_pid = pid

        if nearest_pid is None:
            continue

        px = players[nearest_pid]["x"]
        pz = players[nearest_pid]["z"]

        dx = px - z["x"]
        dz = pz - z["z"]
        dist = math.sqrt(dx*dx + dz*dz) + 1e-6

        z["x"] += (dx / dist) * ZOMBIE_SPEED
        z["z"] += (dz / dist) * ZOMBIE_SPEED


# ------------------------------
# ZOMBIE DAMAGE
# ------------------------------
def zombie_damage_check():
    now = time.time()

    for zid, z in zombies.items():
        zx, zz = z["x"], z["z"]

        for pid, p in players.items():
            dx = p["x"] - zx
            dz = p["z"] - zz
            dist = math.sqrt(dx*dx + dz*dz)

            if dist < 1.0:
                last = p.get("last_hit", 0)

                if now - last > 0.5:
                    p["hp"] -= 1
                    p["last_hit"] = now
                    if p["hp"] < 0:
                        p["hp"] = 0


# ------------------------------
# ZOMBIE SPAWNER
# ------------------------------
async def zombie_spawner():
    global NEXT_ZID

    while True:
        await asyncio.sleep(1)   # spawn every 10 seconds

        angle = random.random() * 2 * math.pi
        r = MAX_RADIUS - 2

        x = math.cos(angle) * r
        z = math.sin(angle) * r

        zid = NEXT_ZID
        NEXT_ZID += 1

        zombies[zid] = {
            "x": x,
            "y": 0.5,
            "z": z
        }

        print(f"🧟 Spawned zombie {zid} at ({x:.1f}, {z:.1f})")


# ------------------------------
# WINNER CALCULATION
# ------------------------------
def compute_winner():
    if not players:
        return None

    best_pid = None
    best_hp = -1

    for pid, p in players.items():
        if p["hp"] > best_hp:
            best_hp = p["hp"]
            best_pid = pid

    return best_pid


async def round_timer_loop():
    global round_start, phase, winner_pid

    while True:
        now = time.time()
        elapsed = now - round_start

        # ---- WAITING (0–3s) ----
        if elapsed < WAIT_TIME:
            phase = "waiting"
            winner_pid = None

        # ---- PLAY (3–63s) ----
        elif elapsed < WAIT_TIME + PLAY_TIME:
            phase = "play"
            winner_pid = None

        # ---- RESULTS (63–66s) ----
        elif elapsed < WAIT_TIME + ROUND_TIME:
            if phase != "results":
                phase = "results"
                winner_pid = compute_winner()
                print(f"🏆 Winner: {players[winner_pid]['username'] if winner_pid else 'None'}")


        await asyncio.sleep(0.2)

# ------------------------------
# MAIN WORLD LOOP (100 FPS)
# ------------------------------
async def world_loop():
    while True:
        if players and phase == "play":
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
    asyncio.create_task(round_timer_loop())


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
        "hp": 100,
        "ws": ws,
        "username": username,
        "last_hit": 0
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
