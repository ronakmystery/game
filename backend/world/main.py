import asyncio
import random
import math
import time
from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI()

# ---------------------------------------------------
# GAME STATE
# ---------------------------------------------------

players = {}        # pid → {x,y,z,hp,ws,username,last_hit, inventory}
zombies = {}        # zid → {x,y,z}
items = {}          # item_id → {x,y,z,type}  (heal or bomb)

NEXT_ZID = 1
NEXT_ITEM_ID = 1

SPEED = 0.1
ZOMBIE_SPEED = 0.02
MAX_RADIUS = 30

# ---------------------------------------------------
# ROUND SYSTEM
# ---------------------------------------------------

ROUND_TIME = 63
PLAY_TIME = 60
WAIT_TIME = 3

round_start = time.time()
phase = "play"
winner_pid = None


# ---------------------------------------------------
# BROADCAST STATE
# ---------------------------------------------------
async def broadcast_state():
    now = time.time()
    remaining = max(0, ROUND_TIME - (now - round_start))

    # ---------- LEADERBOARD ----------
    leaderboard = sorted(
        [
            {
                "pid": pid,
                "username": p["username"],
                "kills": p.get("zkills", 0),
                "hp": p["hp"]
            }
            for pid, p in players.items()
        ],
        key=lambda x: (-x["kills"], -x["hp"])
    )

    # ---------- STATE ----------
    state = {
        "type": "state",
        "phase": phase,
        "timer": remaining,
        "winner": winner_pid,
        "leaderboard": leaderboard,

        "players": {
            pid: {
                "x": p["x"],
                "y": p["y"],
                "z": p["z"],
                "hp": p["hp"],
                "username": p["username"],
                "inventory": p["inventory"],
                "zkills": p["zkills"]
            }
            for pid, p in players.items()
        },

        "zombies": {
            zid: {"x": z["x"], "y": z["y"], "z": z["z"]}
            for zid, z in zombies.items()
        },

        "items": {
            iid: {"x": it["x"], "y": it["y"], "z": it["z"], "type": it["type"]}
            for iid, it in items.items()
        }
    }

    # ---------- SEND ----------
    dead_ws = []
    for pid, p in players.items():
        try:
            await p["ws"].send_json(state)
        except:
            dead_ws.append(pid)

    for pid in dead_ws:
        print(f"Disconnected {pid}")
        players.pop(pid, None)


# ---------------------------------------------------
# MOVEMENT
# ---------------------------------------------------
def apply_move(pid, key):
    if phase != "play":
        return

    p = players[pid]
    nx, nz = p["x"], p["z"]

    if key == "w":
        nz -= SPEED
    elif key == "s":
        nz += SPEED
    elif key == "a":
        nx -= SPEED
    elif key == "d":
        nx += SPEED

    if math.sqrt(nx * nx + nz * nz) <= MAX_RADIUS:
        p["x"] = nx
        p["z"] = nz


# ---------------------------------------------------
# ZOMBIE AI
# ---------------------------------------------------
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


# ---------------------------------------------------
# ZOMBIE DAMAGE
# ---------------------------------------------------
async def zombie_damage_check():
    now = time.time()
    dead = []

    for zid, z in zombies.items():
        for pid, p in players.items():
            dx = p["x"] - z["x"]
            dz = p["z"] - z["z"]
            dist = math.sqrt(dx*dx + dz*dz)

            if dist < 1.0:
                if now - p.get("last_hit", 0) > 0.5:
                    p["hp"] -= random.randint(5, 15)
                    p["last_hit"] = now

                    if p["hp"] <= 0:
                        p["hp"] = 0
                        dead.append(pid)

    # kill after loop
    for pid in dead:
        if pid in players:
            print(f"💀 Player {pid} died")
            try:
                await players[pid]["ws"].send_json({"type": "death"})
            except:
                pass
            players.pop(pid, None)


# ---------------------------------------------------
# ITEM SPAWNER (heal + bomb)
# ---------------------------------------------------
async def item_spawner():
    global NEXT_ITEM_ID
    while True:
        await asyncio.sleep(4)

        angle = random.random() * 2 * math.pi
        r = random.uniform(5, MAX_RADIUS - 1)

        x = math.cos(angle) * r
        z = math.sin(angle) * r

        item_type = random.choice(["heal", "bomb"])

        items[NEXT_ITEM_ID] = {
            "x": x,
            "y": 0.5,
            "z": z,
            "type": item_type
        }
        print(f"🔵 Spawned {item_type} #{NEXT_ITEM_ID} at ({x:.1f},{z:.1f})")
        NEXT_ITEM_ID += 1


# ---------------------------------------------------
# ZOMBIE SPAWNER  (THIS WAS MISSING)
# ---------------------------------------------------
async def zombie_spawner():
    global NEXT_ZID

    while True:
        await asyncio.sleep(3)  # spawn every 3 sec

        angle = random.random() * 2 * math.pi
        r = MAX_RADIUS - 1      # spawn near border

        x = math.cos(angle) * r
        z = math.sin(angle) * r

        zombies[NEXT_ZID] = {
            "x": x,
            "y": 0.5,
            "z": z
        }

        print(f"🧟 Spawned zombie {NEXT_ZID} at ({x:.1f}, {z:.1f})")
        NEXT_ZID += 1


# ---------------------------------------------------
# ITEM PICKUP
# ---------------------------------------------------
def item_pickup_check():
    remove_ids = []

    for iid, it in items.items():
        for pid, p in players.items():
            dx = p["x"] - it["x"]
            dz = p["z"] - it["z"]
            if dx*dx + dz*dz < 1.2*1.2:

                if it["type"] == "heal":
                    p["inventory"]["heal"] += 1

                elif it["type"] == "bomb":
                    p["inventory"]["bomb"] += 1

                remove_ids.append(iid)

    for iid in remove_ids:
        items.pop(iid, None)


# ---------------------------------------------------
# BOMB USE
# ---------------------------------------------------
async def use_bomb(pid):
    p = players.get(pid)
    if not p:
        return

    if p["inventory"]["bomb"] <= 0:
        return

    # consume bomb
    p["inventory"]["bomb"] -= 1

    px, pz = p["x"], p["z"]

    # --- CONFIG ---
    R2 = 30                # radius^2 (≈4.47 radius)
    PLAYER_DAMAGE = random.randint(10, 30)     # bomb hurts players
    NO_SELF_DAMAGE = True  # prevent suicide
    # ---------------

    killed_zombies = []
    damaged_players = []

    # ------- DAMAGE ZOMBIES -------
    for zid, z in list(zombies.items()):
        dx = z["x"] - px
        dz = z["z"] - pz
        if dx*dx + dz*dz < R2:
            killed_zombies.append(zid)

    for zid in killed_zombies:
        zombies.pop(zid, None)
        p["zkills"] += 1

    # ------- DAMAGE OTHER PLAYERS -------
    for other_pid, other in list(players.items()):
        
        # skip dead/removed
        if other_pid not in players:
            continue

        # skip self (unless suicide allowed)
        if other_pid == pid and NO_SELF_DAMAGE:
            continue

        dx = other["x"] - px
        dz = other["z"] - pz

        if dx*dx + dz*dz < R2:
            other["hp"] -= PLAYER_DAMAGE

            damaged_players.append(other_pid)

            # death check
            if other["hp"] <= 0:
                other["hp"] = 0
                print(f"💥 Bomb killed player {other_pid}")
                try:
                    await other["ws"].send_json({"type": "death"})
                except:
                    pass
                players.pop(other_pid, None)



# ---------------------------------------------------
# HEAL USE
# ---------------------------------------------------
def use_heal(pid):
    p = players[pid]
    if p["inventory"]["heal"] <= 0:
        return

    p["inventory"]["heal"] -= 1
    p["hp"] = min(100, p["hp"] + random.randint(10, 30))
    print(f"🧪 Player {pid} used HEAL → HP={p['hp']}")


# ---------------------------------------------------
# ROUND TIMER
# ---------------------------------------------------
def compute_winner():
    """
    Winner = player with highest zombie kill count.
    Tie-breaker = highest HP.
    """
    if not players:
        return None

    best = None
    best_kills = -1
    best_hp = -1

    for pid, p in players.items():
        kills = p.get("zkills", 0)
        hp = p.get("hp", 0)

        # primary sort: kills
        # secondary sort: hp
        if kills > best_kills or (kills == best_kills and hp > best_hp):
            best_kills = kills
            best_hp = hp
            best = pid

    return best


async def round_timer_loop():
    global round_start, phase, winner_pid
    while True:
        now = time.time()
        elapsed = now - round_start

        if elapsed < WAIT_TIME:
            phase = "waiting"
        elif elapsed < WAIT_TIME + PLAY_TIME:
            phase = "play"
        else:
            if phase != "results":
                phase = "results"
                winner_pid = compute_winner()
                print("🏆 Winner:", winner_pid)

        await asyncio.sleep(0.2)


# ---------------------------------------------------
# MAIN WORLD LOOP
# ---------------------------------------------------
async def world_loop():
    while True:
        if players and phase == "play":
            update_zombies()
            await zombie_damage_check()
            item_pickup_check()

        await broadcast_state()
        await asyncio.sleep(0.01)


# ---------------------------------------------------
# STARTUP
# ---------------------------------------------------
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(world_loop())
    asyncio.create_task(round_timer_loop())
    asyncio.create_task(item_spawner())
    asyncio.create_task(zombie_spawner())


# ---------------------------------------------------
# WEBSOCKET HANDLER
# ---------------------------------------------------
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket, pid: int, username: str):
    await ws.accept()

    print(f"🟢 Player joined {pid} ({username})")

    players[pid] = {
        "x": 0,
        "y": 0.5,
        "z": 0,
        "hp": 100,
        "ws": ws,
        "username": username,
        "last_hit": 0,
        "inventory": {"heal": 0, "bomb": 0},
        "zkills": 0       # <---- ADD THIS

    }

    try:
        while True:
            msg = await ws.receive_json()

            t = msg["type"]

            if t == "move":
                apply_move(pid, msg["key"])

            elif t == "use_heal":
                use_heal(pid)

            elif t == "use_bomb":
               await use_bomb(pid)

    except WebSocketDisconnect:
        print(f"🔴 Player left {pid}")
        players.pop(pid, None)

    except Exception as e:
        print("WS ERR:", e)
        players.pop(pid, None)
