import json
import asyncio
import random
from fastapi import WebSocket
import math

# ============================================================
# CONSTANTS
# ============================================================
TICK_RATE = 0.1          # game tick (10 ticks per second)
ROUND_DELAY = 3.0        # delay before next round starts
ARENA_MIN = -10
ARENA_MAX = 10

# ============================================================
# GLOBAL GAME STATE
# ============================================================
game_state = {
    "players": {},         # username -> {x, y, alive, score}
    "zombies": [],         # list of {x, y, alive}
    "round": 1,
    "round_active": False,
}


# ============================================================
# ZOMBIE SPAWNER
# ============================================================
def spawn_zombies(count):
    zombies = []

    for _ in range(count):
        side = random.choice(["top", "bottom", "left", "right"])

        if side == "top":
            x = random.uniform(ARENA_MIN, ARENA_MAX)
            y = ARENA_MAX
        elif side == "bottom":
            x = random.uniform(ARENA_MIN, ARENA_MAX)
            y = ARENA_MIN
        elif side == "left":
            x = ARENA_MIN
            y = random.uniform(ARENA_MIN, ARENA_MAX)
        else:  # right
            x = ARENA_MAX
            y = random.uniform(ARENA_MIN, ARENA_MAX)

        zombies.append({
            "x": x,
            "y": y,
            "alive": True,
            "hp": random.randint(20, 40),
            "dx": random.uniform(-1, 1),
            "dy": random.uniform(-1, 1),
            "change_timer": random.uniform(1, 2),
            "damage_cd": 0
        })

    return zombies


# ============================================================
# CONNECTION MANAGER
# ============================================================
class ConnectionManager:
    def __init__(self):
        self.active = {}  # websocket → username

    async def connect(self, websocket: WebSocket):
        await websocket.accept()

    def add_player(self, websocket, username):
        self.active[websocket] = username
        game_state["players"][username] = {
            "x": 0,
            "y": 0,
            "alive": True,
            "score": 0,
            "hp": 100
        }


    def remove(self, websocket):
        if websocket in self.active:
            username = self.active[websocket]
            del self.active[websocket]

            if username in game_state["players"]:
                del game_state["players"][username]

    async def broadcast_state(self):
        msg = json.dumps({
            "type": "state",
            "game": game_state
        })

        for ws in list(self.active.keys()):
            try:
                await ws.send_text(msg)
            except:
                self.remove(ws)

manager = ConnectionManager()

# ============================================================
# JOIN HANDLER
# ============================================================
async def process_join(websocket: WebSocket):
    await manager.connect(websocket)

    raw = await websocket.receive_text()
    data = json.loads(raw)

    if data["type"] != "join":
        await websocket.close()
        return

    username = data["username"]
    manager.add_player(websocket, username)

    await manager.broadcast_state()

# ============================================================
# READ PLAYER MESSAGES (MOVEMENT)
# ============================================================
async def process_message(websocket: WebSocket, raw: str):
    data = json.loads(raw)
    username = manager.active.get(websocket)

    if not username:
        return

    if data["type"] == "move":
        p = game_state["players"].get(username)
        if not p or not p["alive"]:
            return

        speed = 0.05
        p["x"] += data["x"] * speed
        p["y"] += data["y"] * speed

        # ------ Clamp to boundaries ------
        p["x"] = max(ARENA_MIN, min(ARENA_MAX, p["x"]))
        p["y"] = max(ARENA_MIN, min(ARENA_MAX, p["y"]))

    

    if data["type"] == "shoot":
        username = manager.active[websocket]
        p = game_state["players"][username]

        fx = data["fx"]
        fy = data["fy"]

        max_dist = 20  

        for z in game_state["zombies"]:
            if not z["alive"]:
                continue

            dx = z["x"] - p["x"]
            dy = z["y"] - p["y"]
            dist = (dx*dx + dy*dy) ** 0.5

            if dist > max_dist:
                continue

            dot = dx * fx + dy * fy
            if dot <= 0:
                continue

            # Aim window ~5 degrees
            cos_limit = 0.995
            aim_cos = dot / dist

            if aim_cos > cos_limit:
                dmg = random.randint(10, 20)

                z["hp"] -= dmg
                if z["hp"] <= 0:
                    z["alive"] = False
                    p["score"] += 1


    await manager.broadcast_state()


async def game_loop():
    next_round_timer = ROUND_DELAY

    # Start round 1
    game_state["zombies"] = spawn_zombies(game_state["round"])
    game_state["round_active"] = True

    while True:
        await asyncio.sleep(TICK_RATE)

        # -----------------------------------
        # ZOMBIE DAMAGE TO PLAYERS (with cooldown)
        # -----------------------------------
        for name, p in list(game_state["players"].items()):
            if not p["alive"]:
                continue

            for z in game_state["zombies"]:
                if not z["alive"]:
                    continue

                # reduce damage cooldown
                if z["damage_cd"] > 0:
                    z["damage_cd"] -= TICK_RATE
                    if z["damage_cd"] < 0:
                        z["damage_cd"] = 0

                dx = p["x"] - z["x"]
                dy = p["y"] - z["y"]
                dist = (dx * dx + dy * dy) ** 0.5

                # must be close AND off cooldown
                if dist < 1 and z["damage_cd"] == 0:
                    dmg = random.randint(5, 20)
                    p["hp"] -= dmg

                    # give zombie a cooldown (1–3 seconds)
                    z["damage_cd"] = random.uniform(1, 3)

                    if p["hp"] <= 0:
                        p["hp"] = 0
                        p["alive"] = False

        # # -----------------------------------
        # # CHECK IF ALL PLAYERS ARE DEAD → RESTART GAME
        # # -----------------------------------
        # alive_players = [p for p in game_state["players"].values() if p["alive"]]

        # if len(alive_players) == 0:
        #     # reset everything
        #     game_state["round"] = 1

        #     for p in game_state["players"].values():
        #         p["x"] = 0
        #         p["y"] = 0
        #         p["alive"] = True
        #         p["hp"] = 100
        #         p["score"] = 0

        #     game_state["zombies"] = spawn_zombies(1)
        #     await manager.broadcast_state()
        #     continue

        # -----------------------------------
        # ZOMBIE RANDOM MOVEMENT
        # -----------------------------------

        for z in game_state["zombies"]:
            if not z["alive"]:
                continue

            # find nearest alive player
            nearest_player = None
            nearest_dist = 99999

            for name, p in game_state["players"].items():
                if not p["alive"]:
                    continue

                dx = p["x"] - z["x"]
                dy = p["y"] - z["y"]
                dist = (dx*dx + dy*dy) ** 0.5

                if dist < nearest_dist:
                    nearest_dist = dist
                    nearest_player = p

            # If no alive players → random walk
            if nearest_player is None:
                z["change_timer"] -= TICK_RATE
                if z["change_timer"] <= 0:
                    z["dx"] = random.uniform(-1, 1)
                    z["dy"] = random.uniform(-1, 1)
                    z["change_timer"] = random.uniform(1, 2)
                move_dx = z["dx"]
                move_dy = z["dy"]

            else:
                # CHASE vector
                dx = nearest_player["x"] - z["x"]
                dy = nearest_player["y"] - z["y"]

                # normalize
                length = (dx*dx + dy*dy) ** 0.5
                if length == 0:
                    move_dx = move_dy = 0
                else:
                    move_dx = dx / length
                    move_dy = dy / length

            # apply movement
            speed = 0.07  # slightly slower than player (0.1)
            z["x"] += move_dx * speed
            z["y"] += move_dy * speed

            # boundaries
            if z["x"] < ARENA_MIN: z["x"] = ARENA_MIN
            if z["x"] > ARENA_MAX: z["x"] = ARENA_MAX
            if z["y"] < ARENA_MIN: z["y"] = ARENA_MIN
            if z["y"] > ARENA_MAX: z["y"] = ARENA_MAX



        # -----------------------------------
        # CHECK IF ALL ZOMBIES ARE DEAD → NEXT ROUND
        # -----------------------------------
        all_dead = all(not z["alive"] for z in game_state["zombies"])

        if all_dead:
            next_round_timer -= TICK_RATE

            if next_round_timer <= 0:
                game_state["round"] += 1
                game_state["zombies"] = spawn_zombies(game_state["round"])
                next_round_timer = ROUND_DELAY

        # -----------------------------------
        # BROADCAST STATE
        # -----------------------------------
        await manager.broadcast_state()
