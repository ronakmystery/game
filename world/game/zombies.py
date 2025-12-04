# zombies.py
import random
from .state import game_state, ARENA_MIN, ARENA_MAX, TICK_RATE
from .utils import clamp, distance
from .loot import spawn_loot
from .players import record_death

def spawn_zombies(count):
    """Spawn zombies around edges of arena."""
    zombies = []

    for _ in range(count*7):
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
def update_zombie_movement(z, players, obstacles, zombies):
    """Zombie AI: chase nearest alive player, wander randomly, avoid clumping."""
    if not z["alive"]:
        return

    # ----------------------------------
    # 1. Find nearest alive player
    # ----------------------------------
    target = None
    nearest = 999999

    for p in players.values():
        if not p["alive"]:
            continue
        d = distance(p["x"], p["y"], z["x"], z["y"])
        if d < nearest:
            nearest = d
            target = p

    # ----------------------------------
    # 2. Determine movement vector
    # ----------------------------------
    if target:
        # Chase
        dx = target["x"] - z["x"]
        dy = target["y"] - z["y"]
        length = max(1e-3, (dx * dx + dy * dy) ** 0.5)
        move_dx = dx / length
        move_dy = dy / length

    else:
        # Random wander
        z["change_timer"] -= TICK_RATE
        if z["change_timer"] <= 0:
            z["change_timer"] = random.uniform(1, 2)
            z["dx"] = random.uniform(-1, 1)
            z["dy"] = random.uniform(-1, 1)

        move_dx = z["dx"]
        move_dy = z["dy"]

    # ----------------------------------
    # 3. REPULSION (anti-clumping)
    # ----------------------------------
    repel_x = 0
    repel_y = 0

    for other in zombies:
        if other is z or not other["alive"]:
            continue

        REPEL_RADIUS = 5.0

        dx2 = z["x"] - other["x"]
        dy2 = z["y"] - other["y"]
        dist2 = max(0.01, (dx2 * dx2 + dy2 * dy2) ** 0.5)

        if dist2 < REPEL_RADIUS:
            strength = (REPEL_RADIUS - dist2) / REPEL_RADIUS
            repel_x += (dx2 / dist2) * strength
            repel_y += (dy2 / dist2) * strength

    # Add repulsion to main move
    move_dx += repel_x * 0.4
    move_dy += repel_y * 0.4

    # Normalize
    l = (move_dx * move_dx + move_dy * move_dy) ** 0.5
    if l > 0:
        move_dx /= l
        move_dy /= l

    # Final speed
    speed = 0.10
    new_x = clamp(z["x"] + move_dx * speed, ARENA_MIN, ARENA_MAX)
    new_y = clamp(z["y"] + move_dy * speed, ARENA_MIN, ARENA_MAX)

    # ----------------------------------
    # 4. Apply movement
    # ----------------------------------
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
        zombies = game_state["zombies"]
        update_zombie_movement(z, players, game_state["obstacles"], zombies)