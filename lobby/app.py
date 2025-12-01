from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from users import router as user_router
from worlds import create_world, WORLDS

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/hello")
def hello():
    return {"msg": "hello from lobby"}

@app.post("/create_world")
def api_create_world():
    return create_world()

@app.get("/worlds")
def list_worlds():
    # Return all worlds EXCEPT the dev world
    return {
        wid: data
        for wid, data in WORLDS.items()
        if wid != "world_dev"
    }


app.include_router(user_router)
