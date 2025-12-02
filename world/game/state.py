# state.py

TICK_RATE = 0.1
ROUND_DELAY = 3.0
ARENA_MIN = -20
ARENA_MAX = 20
PICKUP_RADIUS = 2

game_state = {
    "players": {},
    "zombies": [],
    "loot": [],
    "round": 1,
    "round_active": False,
    "obstacles": [],
}
