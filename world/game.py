import json
import time
from fastapi import WebSocket


# -------------------------------------------------------
# GLOBAL GAME STATE
# -------------------------------------------------------
game_state = {
    "players": {},   # username → {x, y}
}


# -------------------------------------------------------
# CONNECTION MANAGER
# -------------------------------------------------------
class ConnectionManager:
    def __init__(self):
        self.active = {}  # websocket → username

    async def connect(self, websocket: WebSocket):
        await websocket.accept()

    def add_player(self, websocket, username):
        self.active[websocket] = username
        game_state["players"][username] = {"x": 0, "y": 0}

    def remove(self, websocket):
        if websocket in self.active:
            username = self.active[websocket]
            del self.active[websocket]

            if username in game_state["players"]:
                del game_state["players"][username]

    async def broadcast_state(self):
        msg = json.dumps({
            "type": "state",
            "game": game_state
        })

        for ws in list(self.active.keys()):
            try:
                await ws.send_text(msg)
            except:
                self.remove(ws)


manager = ConnectionManager()


# -------------------------------------------------------
# JOIN HANDLER
# -------------------------------------------------------
async def process_join(websocket: WebSocket):
    await manager.connect(websocket)

    raw = await websocket.receive_text()
    data = json.loads(raw)

    if data["type"] != "join":
        await websocket.close()
        return

    username = data["username"]
    manager.add_player(websocket, username)

    # send full state to everyone
    await manager.broadcast_state()


# -------------------------------------------------------
# GAME MESSAGE HANDLER
# -------------------------------------------------------
async def process_message(websocket: WebSocket, raw: str):
    data = json.loads(raw)
    username = manager.active.get(websocket)

    if data["type"] == "move":
        if username in game_state["players"]:
            speed = .1  # tweak speed here
            
            game_state["players"][username]["x"] += data["x"] * speed
            game_state["players"][username]["y"] += data["y"] * speed



    await manager.broadcast_state()
