import random
from .state import ARENA_MIN, ARENA_MAX

def random_obstacles(count=6):
    obs = []

    for _ in range(count):
        w = random.uniform(1, 2)
        h = random.uniform(2, 4)

        x = random.uniform(ARENA_MIN + w, ARENA_MAX - w)
        y = random.uniform(ARENA_MIN + h, ARENA_MAX - h)

        obs.append({
            "x": x,
            "y": y,
            "w": w,
            "h": h
        })

    return obs
