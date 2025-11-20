

from state import players, zombies, items, phase, ROUND_TIME, round_start, winner_pid
import time

# ---------------------------------------------------
# BROADCAST STATE
# ---------------------------------------------------
async def broadcast_state():
    now = time.time()
    remaining = max(0, ROUND_TIME - (now - round_start))

    # ---------- LEADERBOARD ----------
    leaderboard = sorted(
        [
            {
                "pid": pid,
                "username": p["username"],
                "kills": p.get("zkills", 0),
                "hp": p["hp"]
            }
            for pid, p in players.items()
        ],
        key=lambda x: (-x["kills"], -x["hp"])
    )

    # ---------- STATE ----------
    state = {
        "type": "state",
        "phase": phase,
        "timer": remaining,
        "winner": winner_pid,
        "leaderboard": leaderboard,

        "players": {
            pid: {
                "x": p["x"],
                "y": p["y"],
                "z": p["z"],
                "hp": p["hp"],
                "username": p["username"],
                "inventory": p["inventory"],
                "zkills": p["zkills"]
            }
            for pid, p in players.items()
        },

        "zombies": {
            zid: {"x": z["x"], "y": z["y"], "z": z["z"]}
            for zid, z in zombies.items()
        },

        "items": {
            iid: {"x": it["x"], "y": it["y"], "z": it["z"], "type": it["type"]}
            for iid, it in items.items()
        }
    }

    # ---------- SEND ----------
    dead_ws = []
    for pid, p in players.items():
        if p["ws"] is None:
            continue  # AI bot does not have websocket
        try:
            await p["ws"].send_json(state)
        except:
            dead_ws.append(pid)

    for pid in dead_ws:
        print(f"Disconnected {pid}")
        players.pop(pid, None)

