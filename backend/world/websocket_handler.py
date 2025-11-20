
# ---------------------------------------------------
# WEBSOCKET HANDLER
# ---------------------------------------------------
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket, pid: int, username: str):
    await ws.accept()



    players[pid] = {
        "x": 0,
        "y": 0.5,
        "z": 0,
        "hp": 100,
        "ws": ws,
        "username": username,
        "last_hit": 0,
        "inventory": {"heal": 0, "bomb": 0},
        "zkills": 0       # <---- ADD THIS

    }

    try:
        while True:
            msg = await ws.receive_json()

            t = msg["type"]

            if t == "move":
                apply_move(pid, msg["key"])

            elif t == "use_heal":
                use_heal(pid)

            elif t == "use_bomb":
               await use_bomb(pid)

    except WebSocketDisconnect:
        print(f"🔴 Player left {pid}")
        players.pop(pid, None)

    except Exception as e:
        print("WS ERR:", e)
        players.pop(pid, None)
