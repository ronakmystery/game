import random
import math
from .state import ARENA_MIN, ARENA_MAX

def random_obstacles(count=6):
    obs = []

    INNER_RADIUS = 5      # no obstacles near 0,0
    OUTER_RADIUS = 20    # keeps obstacles mid-field

    for _ in range(count):
        w = random.uniform(1, 2)
        h = random.uniform(2, 4)

        while True:
            # pick ANYWHERE in arena
            x = random.uniform(ARENA_MIN + w, ARENA_MAX - w)
            y = random.uniform(ARENA_MIN + h, ARENA_MAX - h)

            # distance from player (0,0)
            dist = math.sqrt(x*x + y*y)

            # accept only if in the "ring zone"
            if INNER_RADIUS < dist < OUTER_RADIUS:
                break

        obs.append({
            "x": x,
            "y": y,
            "w": w,
            "h": h
        })

    return obs
