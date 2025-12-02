# zombies.py
import random
from .state import game_state, ARENA_MIN, ARENA_MAX, TICK_RATE
from .utils import clamp, distance
from .loot import spawn_loot

def spawn_zombies(count):
    """Spawn zombies around edges of arena."""
    zombies = []

    for _ in range(count):
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
            "hp": random.randint(70, 100),
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
        z["hp"] -= random.randint(1, 5)
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
            return


def update_zombie_movement(z, players):
    """Chase nearest alive player, otherwise random move."""
    if not z["alive"]:
        return

    # find nearest player
    target = None
    nearest = 9999

    for p in players.values():
        if not p["alive"]:
            continue
        d = distance(p["x"], p["y"], z["x"], z["y"])
        if d < nearest:
            nearest = d
            target = p

    # chase
    if target:
        dx = target["x"] - z["x"]
        dy = target["y"] - z["y"]
        length = max(1e-5, (dx * dx + dy * dy) ** 0.5)

        move_dx = dx / length
        move_dy = dy / length
    else:
        # random walk
        z["change_timer"] -= TICK_RATE
        if z["change_timer"] <= 0:
            z["change_timer"] = random.uniform(1, 2)
            z["dx"] = random.uniform(-1, 1)
            z["dy"] = random.uniform(-1, 1)
        move_dx = z["dx"]
        move_dy = z["dy"]

    speed = 0.07
    z["x"] = clamp(z["x"] + move_dx * speed, ARENA_MIN, ARENA_MAX)
    z["y"] = clamp(z["y"] + move_dy * speed, ARENA_MIN, ARENA_MAX)


def update_zombies():
    """Master update for all zombie behavior."""
    players = game_state["players"]

    for z in game_state["zombies"]:
        if not z["alive"]:
            continue

        update_zombie_decay(z)
        update_zombie_attack(z, players)
        update_zombie_movement(z, players)
