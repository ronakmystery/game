# zombies.py
import random
from .state import game_state, ARENA_MIN, ARENA_MAX, TICK_RATE
from .utils import clamp, distance
from .loot import spawn_loot
from .players import record_death

def spawn_zombies(count):
    """Spawn zombies around edges of arena."""
    zombies = []

    for _ in range(count*10):
        side = random.choice(["top", "bottom", "left", "right"])

        if side == "top":
            x, y = random.uniform(ARENA_MIN, ARENA_MAX), ARENA_MAX
        elif side == "bottom":
            x, y = random.uniform(ARENA_MIN, ARENA_MAX), ARENA_MIN
        elif side == "left":
            x, y = ARENA_MIN, random.uniform(ARENA_MIN, ARENA_MAX)
        else:
            x, y = ARENA_MAX, random.uniform(ARENA_MIN, ARENA_MAX)

        zombies.append({
            "x": x, "y": y,
            "alive": True,
            "hp": 100,
            "max_hp": 100,
            "dx": random.uniform(-1, 1),
            "dy": random.uniform(-1, 1),
            "change_timer": random.uniform(1, 2),
            "damage_cd": 0,
            "auto_decay_cd": 1.0
        })

    return zombies


def update_zombie_decay(z):
    """Apply 1–5 HP decay every second."""
    z["auto_decay_cd"] -= TICK_RATE
    if z["auto_decay_cd"] <= 0:
        z["hp"] -= random.randint(1,3)
        z["auto_decay_cd"] = 1.0

        if z["hp"] <= 0:
            z["alive"] = False
            game_state["loot"].append(spawn_loot(z))


def update_zombie_attack(z, players):
    """Zombie damages player if close."""
    if z["damage_cd"] > 0:
        z["damage_cd"] -= TICK_RATE
        return

    for p in players.values():
        if not p["alive"]:
            continue

        if distance(p["x"], p["y"], z["x"], z["y"]) < 1:
            p["hp"] -= random.randint(5, 20)
            z["damage_cd"] = random.uniform(1, 3)
            if p["hp"] <= 0:
                p["hp"] = 0
                p["alive"] = False
                record_death(p["username"])
            return
def update_zombie_movement(z, players, obstacles):
    """Chase nearest alive player, otherwise random walk. Includes obstacle collision."""
    if not z["alive"]:
        return

    # ------------------------------
    # 1. Find nearest alive player
    # ------------------------------
    target = None
    nearest = 999999

    for p in players.values():
        if not p["alive"]:
            continue

        d = distance(p["x"], p["y"], z["x"], z["y"])
        if d < nearest:
            nearest = d
            target = p

    # ------------------------------
    # 2. Determine movement vector
    # ------------------------------
    if target:
        # Chase
        dx = target["x"] - z["x"]
        dy = target["y"] - z["y"]
        length = max(1e-5, (dx*dx + dy*dy) ** 0.5)
        move_dx = dx / length
        move_dy = dy / length

    else:
        # Random wandering
        z["change_timer"] -= TICK_RATE
        if z["change_timer"] <= 0:
            z["change_timer"] = random.uniform(1, 2)
            z["dx"] = random.uniform(-2, 2)
            z["dy"] = random.uniform(-2, 2)

        move_dx = z["dx"]
        move_dy = z["dy"]

    speed = 0.1

    # Proposed position
    new_x = clamp(z["x"] + move_dx * speed, ARENA_MIN, ARENA_MAX)
    new_y = clamp(z["y"] + move_dy * speed, ARENA_MIN, ARENA_MAX)

    # # ------------------------------
    # # 3. Obstacle collision check
    # # ------------------------------
    # def blocked(px, py):
    #     for ob in obstacles:
    #         if (
    #             px > ob["x"] - ob["w"] and
    #             px < ob["x"] + ob["w"] and
    #             py > ob["y"] - ob["h"] and
    #             py < ob["y"] + ob["h"]
    #         ):
    #             return True
    #     return False

    # # If hitting an obstacle → bounce
    # if blocked(new_x, new_y):
    #     # Push zombie away from the obstacle direction
    #     z["dx"] = random.uniform(-1, 1)
    #     z["dy"] = random.uniform(-1, 1)

    #     # Normalize bounce
    #     l = (z["dx"]**2 + z["dy"]**2) ** 0.5
    #     if l > 0:
    #         z["dx"] /= l
    #         z["dy"] /= l

    #     # Move slightly backwards
    #     z["x"] -= move_dx * speed * 0.5
    #     z["y"] -= move_dy * speed * 0.5
    #     return

    # ------------------------------
    # 4. Move zombie normally
    # ------------------------------
    z["x"] = new_x
    z["y"] = new_y


def update_zombies():
    """Master update for all zombie behavior."""
    players = game_state["players"]

    for z in game_state["zombies"]:
        if not z["alive"]:
            continue

        update_zombie_decay(z)
        update_zombie_attack(z, players)
        update_zombie_movement(z, players, game_state["obstacles"])
