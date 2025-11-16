from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import time

app = FastAPI()

# 💾 Store connected players
players = {}   # pid -> websocket connection

@app.get("/")
def home():
    return {"msg": "world is running", "players": list(players.keys())}

@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket, pid: int):
    await ws.accept()
    players[pid] = ws

    print(f"🟢 Player {pid} joined world")

    # Notify existing players
    for other_pid, other_ws in players.items():
        if other_pid != pid:
            await other_ws.send_json({"event": "player_joined", "id": pid})

    try:
        while True:
            msg = await ws.receive_text()
            print(f"Player {pid} says: {msg}")

    except WebSocketDisconnect:
        # Player left
        del players[pid]
        print(f"🔴 Player {pid} left world")

        # Notify others
        for other_ws in players.values():
            await other_ws.send_json({"event": "player_left", "id": pid})
