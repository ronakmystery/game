import time
from state import players, ROUND_TIME, PLAY_TIME, WAIT_TIME, round_start, phase, winner_pid
import asyncio
def compute_winner():
    if not players:
        return None

    best = None
    best_kills = -1
    best_hp = -1

    for pid, p in players.items():
        kills = p.get("zkills", 0)
        hp = p.get("hp", 0)
        if kills > best_kills or (kills == best_kills and hp > best_hp):
            best_kills = kills
            best_hp = hp
            best = pid

    return best


async def round_timer_loop():
    global phase, round_start, winner_pid

    while True:
        now = time.time()
        elapsed = now - round_start

        if elapsed < WAIT_TIME:
            phase = "waiting"
        elif elapsed < WAIT_TIME + PLAY_TIME:
            phase = "play"
        else:
            if phase != "results":
                phase = "results"
                winner_pid = compute_winner()
                print("🏆 Winner:", winner_pid)

        await asyncio.sleep(0.2)
