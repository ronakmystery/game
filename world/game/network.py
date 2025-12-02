# network.py
import json
from fastapi import WebSocket
from .state import game_state
from .players import move_player, player_shoot

import time

class ConnectionManager:
    def __init__(self):
        self.active = {}  # websocket → username

    async def connect(self, ws: WebSocket):
        await ws.accept()

    def add_player(self, ws, username):
        self.active[ws] = username
        game_state["players"][username] = {
            "x": 0,
            "y": 0,
            "alive": True,
            "score": 0,
            "hp": 100,
            "ammo": 30,
            "username": username,
            "spawn_time": time.time()
        }

    def remove(self, ws):
        if ws in self.active:
            name = self.active.pop(ws)
            game_state["players"].pop(name, None)

    async def broadcast(self):
        msg = json.dumps({
            "type": "state",
            "game": {
                "players": {k: p.copy() for k,p in game_state["players"].items()},
                "zombies": [z.copy() for z in game_state["zombies"]],
                "loot": [l.copy() for l in game_state["loot"]],
                "round": game_state["round"],
                "round_active": game_state["round_active"],
                "obstacles": [ob.copy() for ob in game_state["obstacles"]],
            }
        })

        for ws in list(self.active.keys()):
            try:
                await ws.send_text(msg)
            except:
                self.remove(ws)


manager = ConnectionManager()


async def process_join(ws: WebSocket):
    await manager.connect(ws)

    msg = await ws.receive_text()
    data = json.loads(msg)

    if data.get("type") != "join":
        await ws.close()
        return

    manager.add_player(ws, data["username"])
    await manager.broadcast()


async def process_message(ws: WebSocket, raw: str):
    data = json.loads(raw)
    user = manager.active.get(ws)
    if not user:
        return

    t = data["type"]

    if t == "move":
        move_player(user, data["x"], data["y"])

    elif t == "shoot":
        player_shoot(user, data["fx"], data["fy"])

    await manager.broadcast()
