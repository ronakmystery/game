from fastapi import FastAPI, WebSocket

app = FastAPI()

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket, pid: int, username: str):
    await ws.accept()

    print(f"🟢 Player joined: pid={pid}, username={username}")

    # Tell the player they joined
    await ws.send_json({
        "type": "welcome",
        "message": f"Welcome {username}!",
        "pid": pid
    })

    # Keep receiving messages
    try:
        while True:
            msg = await ws.receive_text()
            print(f"Message from {username}: {msg}")

            # Echo it back to the player (simple demo)
            await ws.send_json({
                "from": username,
                "echo": msg
            })

    except Exception:
        print(f"🔴 Player disconnected: {username}")
