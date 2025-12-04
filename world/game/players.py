# players.py
import random
from .state import game_state, ARENA_MIN, ARENA_MAX
from .utils import clamp, distance
from .loot import spawn_loot
from .utils import rect_hit

import time
from .database import save_stats

def record_death(username):
    p = game_state["players"][username]

    kills = p.get("score", 0)
    max_round = game_state["round"]
    survival_time = time.time() - p.get("spawn_time", time.time())
    print(f"[GAME] Player {p['username']} has died.")


    save_stats(
        username=username,
        kills=kills,
        max_round=max_round,
        survival_time=survival_time,
    )

def move_player(username, xdir, ydir):
    p = game_state["players"][username]
    speed = 0.05

    # -------------------------------
    # Store direction (for model rotation)
    # -------------------------------
    p["dx"] = xdir
    p["dy"] = ydir

    # Compute new position
    new_x = clamp(p["x"] + xdir * speed, ARENA_MIN, ARENA_MAX)
    new_y = clamp(p["y"] + ydir * speed, ARENA_MIN, ARENA_MAX)

    # Collision block (optional)
    # for ob in game_state["obstacles"]:
    #     if rect_hit(new_x, new_y, ob):
    #         return

    # Commit movement
    p["x"] = new_x
    p["y"] = new_y

def player_shoot(username, fx, fy):
    p = game_state["players"][username]

    if p["ammo"] <= 0:
        return

    # -----------------------
    # Damage function
    # -----------------------
    def calc_damage(p):
        base = random.randint(5, 15)

        if p["score"] > 10:
            return int(base * 4.0)     
        else:
            return base

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

        # 🔥 AUTO-HIT if zombie extremely close
        if dist < 1.3:
            dmg = calc_damage(p)
            z["hp"] -= dmg

            if z["hp"] <= 0:
                z["alive"] = False
                p["score"] += 1
                game_state["loot"].append(spawn_loot(z))
            continue

        # Angle filter
        dot = dx * fx + dy * fy
        if dot <= 0:
            continue

        if (dot / dist) > 0.999:
            dmg = calc_damage(p)
            z["hp"] -= dmg

            if z["hp"] <= 0:
                z["alive"] = False
                p["score"] += 1
                game_state["loot"].append(spawn_loot(z))
