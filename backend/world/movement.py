# movement.py

import math
from state import players, phase, SPEED, MAX_RADIUS

def apply_move(pid, key):
    if phase != "play":
        return

    p = players[pid]
    nx, nz = p["x"], p["z"]

    if key == "w": nz -= SPEED
    elif key == "s": nz += SPEED
    elif key == "a": nx -= SPEED
    elif key == "d": nx += SPEED

    if math.sqrt(nx*nx + nz*nz) <= MAX_RADIUS:
        p["x"] = nx
        p["z"] = nz
