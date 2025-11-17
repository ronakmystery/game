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
ZOMBIE_SPEED = 0.03
MAX_RADIUS = 30

AI_PID = -1      # special id
AI_ENABLED = True


# ---------------------------------------------------
# ROUND SYSTEM
# ---------------------------------------------------

ROUND_TIME = 65
PLAY_TIME = 60
WAIT_TIME = 5

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
        if p["ws"] is None:
            continue  # AI bot does not have websocket
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
                    p["hp"] -= random.randint(10, 30)
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

    MAX_ITEMS = 20
    MIN_DIST_FROM_PLAYER = 3.0

    while True:
        # random spawn interval: 4–7s
        await asyncio.sleep(random.uniform(4, 7))

        # don't spawn infinite items
        if len(items) >= MAX_ITEMS:
            continue

        # --------------- choose item type ----------------
        item_type = random.choices(
            ["heal", "bomb"],
            weights=[0.6, 0.4],  # 60% heal, 40% bomb
            k=1
        )[0]

        # --------------- find a valid spawn point ----------
        for _ in range(10):  # try up to 10 positions
            angle = random.random() * math.pi * 2
            r = random.uniform(10, MAX_RADIUS)

            x = math.cos(angle) * r
            z = math.sin(angle) * r

            # ensure not too close to a player
            ok = True
            for pid, p in players.items():
                dx = p["x"] - x
                dz = p["z"] - z
                if dx*dx + dz*dz < MIN_DIST_FROM_PLAYER**2:
                    ok = False
                    break

            if ok:
                items[NEXT_ITEM_ID] = {
                    "x": x,
                    "y": 0.5,
                    "z": z,
                    "type": item_type
                }
                NEXT_ITEM_ID += 1
                break


# ---------------------------------------------------
# ZOMBIE SPAWNER  (THIS WAS MISSING)
# ---------------------------------------------------
async def zombie_spawner():
    global NEXT_ZID

    while True:
        await asyncio.sleep(2)  

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
            ai_update()
            update_zombies()
            await zombie_damage_check()
            item_pickup_check()

        await broadcast_state()
        await asyncio.sleep(0.01)

def ai_update():
    if AI_PID not in players:
        return

    ai = players[AI_PID]
    now = time.time()

    # ---------------------------------------------------
    # 1. Pick a direction every 1–3 seconds
    # ---------------------------------------------------
    if now > ai["move_until"]:
        angle = random.uniform(0, 2 * math.pi)
        ai["vx"] = math.cos(angle) * 0.05
        ai["vz"] = math.sin(angle) * 0.05

        ai["move_until"] = now + random.uniform(1.0, 7.0)


    # ---------------------------------------------------
    # 3. Apply velocity (SMOOTH MOVEMENT)
    # ---------------------------------------------------
    ai["x"] += ai["vx"]
    ai["z"] += ai["vz"]

    # ---------------------------------------------------
    # 4. Stay inside map
    # ---------------------------------------------------
    dist_center = math.sqrt(ai["x"]**2 + ai["z"]**2)
    if dist_center > MAX_RADIUS:
        # flip direction back inward
        ai["vx"] = -ai["vx"]
        ai["vz"] = -ai["vz"]
        ai["x"] += ai["vx"]
        ai["z"] += ai["vz"]

# ---------------------------------------------------
# STARTUP
# ---------------------------------------------------
@app.on_event("startup")
async def startup_event():

        # --- Create AI bot ---
    if AI_ENABLED:
       players[AI_PID] = {
            "x": 5,
            "y": 0.5,
            "z": 5,
            "hp": 100,
            "ws": None,
            "username": "AI-Bot",
            "last_hit": 0,
            "inventory": {"heal": 1, "bomb": 1},
            "zkills": 0,

            # NEW:
            "vx": 0,  # velocity x
            "vz": 0,  # velocity z
            "move_until": 0,  # when to pick new direction
        }


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
