# loot.py
import random
from .state import game_state, PICKUP_RADIUS
from .utils import distance

import time

def spawn_loot(z):
    now = time.time()

    if random.random() < 0.5:
        return {
            "type": "health",
            "x": z["x"],
            "y": z["y"],
            "value": random.randint(5, 30),
            "spawn_time": now,
        }
    else:
        return {
            "type": "ammo",
            "x": z["x"],
            "y": z["y"],
            "value": random.randint(10, 30),
            "spawn_time": now,
        }


def update_loot():
    now = time.time()
    LIFETIME = 10.0   # seconds

    new_loot = []

    for drop in game_state["loot"]:
        # Remove expired loot
        if now - drop["spawn_time"] > LIFETIME:
            continue

        picked = False

        for p in game_state["players"].values():
            if not p["alive"]:
                continue

            if distance(p["x"], p["y"], drop["x"], drop["y"]) < PICKUP_RADIUS:
                picked = True

                if drop["type"] == "health":
                    p["hp"] = min(100, p["hp"] + drop["value"])
                else:
                    p["ammo"] += drop["value"]

                break

        if not picked:
            new_loot.append(drop)

    game_state["loot"] = new_loot
