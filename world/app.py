from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from game import game_state, manager, process_join, process_message


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/hello")
def hello():
    return {"msg": "hello from world"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    # Wait for /join message
    try:
        await process_join(websocket)
    except:
        await websocket.close()
        return

    # Main game loop
    try:
        while True:
            raw = await websocket.receive_text()
            await process_message(websocket, raw)
    except WebSocketDisconnect:
        pass

    manager.remove(websocket)
    await manager.broadcast_state()
