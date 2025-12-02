# players.py
import random
from .state import game_state, ARENA_MIN, ARENA_MAX
from .utils import clamp, distance
from .loot import spawn_loot

def move_player(username, xdir, ydir):
    p = game_state["players"][username]
    speed = 0.05
    p["x"] = clamp(p["x"] + xdir * speed, ARENA_MIN, ARENA_MAX)
    p["y"] = clamp(p["y"] + ydir * speed, ARENA_MIN, ARENA_MAX)


def player_shoot(username, fx, fy):
    p = game_state["players"][username]

    if p["ammo"] <= 0:
        return

    p["ammo"] -= 1
    max_dist = 20

    for z in game_state["zombies"]:
        if not z["alive"]:
            continue

        dx = z["x"] - p["x"]
        dy = z["y"] - p["y"]
        dist = (dx*dx + dy*dy) ** 0.5

        if dist > max_dist:
            continue

        # angle filter
        dot = dx * fx + dy * fy
        if dot <= 0:
            continue

        if (dot / dist) > 0.995:
            dmg = random.randint(5, 10)
            z["hp"] -= dmg

            if z["hp"] <= 0:
                z["alive"] = False
                p["score"] += 1
                game_state["loot"].append(spawn_loot(z))
