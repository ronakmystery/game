import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI()

# Player storage
players = {}            # { pid: {"x":0,"y":0.5,"z":0, "ws":WebSocket} }
SPEED = 0.2             # movement speed per tick


# ---------------------------------------
# BROADCAST STATE TO ALL CONNECTED PLAYERS
# ---------------------------------------
async def broadcast_state():
    state = {
        "type": "state",
        "players": {pid: {"x": p["x"], "y": p["y"], "z": p["z"]} for pid, p in players.items()}
    }

    dead = []

    for pid, p in players.items():
        try:
            await p["ws"].send_json(state)
        except:
            dead.append(pid)

    # remove disconnected clients
    for pid in dead:
        print(f"Removing dead player {pid}")
        players.pop(pid, None)


# ---------------------------------------
# APPLY MOVEMENT
# ---------------------------------------
def apply_move(pid, key):
    p = players[pid]

    if key == "w":
        p["z"] -= SPEED
    elif key == "s":
        p["z"] += SPEED
    elif key == "a":
        p["x"] -= SPEED
    elif key == "d":
        p["x"] += SPEED


# ---------------------------------------
# WORLD LOOP: BROADCAST 20 FPS
# ---------------------------------------
async def world_loop():
    while True:
        if players:
            await broadcast_state()
        await asyncio.sleep(0.05)  # 20 updates/sec


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(world_loop())


# ---------------------------------------
# WEBSOCKET CONNECTION
# ---------------------------------------
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket, pid: int, username: str):
    await ws.accept()

    print(f"🟢 Player joined: {username} (pid={pid})")

    # Initialize player
    players[pid] = {
        "x": 0,
        "y": 0.5,
        "z": 0,
        "ws": ws,
        "username": username,
    }

    # Send welcome
    await ws.send_json({
        "type": "welcome",
        "pid": pid,
        "message": f"Welcome {username}!"
    })

    try:
        while True:
            msg = await ws.receive_json()

            if msg["type"] == "move":
                apply_move(msg["pid"], msg["key"])

            # ignore everything else for now

    except WebSocketDisconnect:
        print(f"🔴 Player disconnected: {username}")
        players.pop(pid, None)

    except Exception as e:
        print("WS ERROR:", e)
        players.pop(pid, None)
