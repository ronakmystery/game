from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio

# Import core game modules
from game.state import game_state
from game.network import manager, process_join, process_message
from game.main_game_loop import game_loop   

app = FastAPI()

# CORS for frontend
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

    # Wait for join packet
    try:
        await process_join(websocket)
    except:
        await websocket.close()
        return

    # Handle messages
    try:
        while True:
            raw = await websocket.receive_text()
            await process_message(websocket, raw)
    except WebSocketDisconnect:
        pass

    # Cleanup on disconnect
    manager.remove(websocket)
    await manager.broadcast()
    

# -------------------------------------------------
#   START GAME LOOP ON SERVER STARTUP
# -------------------------------------------------
@app.on_event("startup")
async def _startup():
    asyncio.create_task(game_loop())
