# login.py
import time
import threading
import pymysql
import bcrypt
from fastapi import APIRouter, HTTPException, Request

from worlds import WORLDS, create_world     # <-- required for join_world

router = APIRouter()


IP = "10.192.46.155"

# ----------------------------------------------------------
# DB CONNECTION
# ----------------------------------------------------------
conn = pymysql.connect(
    host="db",
    user="game",
    password="game123",
    database="game_db",
    autocommit=True
)

# ----------------------------------------------------------
# USER STATE
# ----------------------------------------------------------
CURRENT_USERS = {}       # username → last heartbeat
PLAYER_WORLD = {}        # username → world_name
HEARTBEAT_TIMEOUT = 2    # seconds


# ----------------------------------------------------------
# CLEANUP THREAD (removes inactive users)
# ----------------------------------------------------------
def cleanup_loop():
    while True:
        now = time.time()
        dead = [u for u, last in CURRENT_USERS.items() if now - last > HEARTBEAT_TIMEOUT]

        for user in dead:
            print(f"[USER-CLEANUP] Removed inactive user {user}")

            # Remove from world
            if user in PLAYER_WORLD:
                wname = PLAYER_WORLD[user]
                if wname in WORLDS:
                    WORLDS[wname]["players"].discard(user)
                del PLAYER_WORLD[user]

            del CURRENT_USERS[user]

        time.sleep(1)


threading.Thread(target=cleanup_loop, daemon=True).start()


# ----------------------------------------------------------
# REGISTER
# ----------------------------------------------------------
@router.post("/register")
def register(username: str, password: str):
    pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    cur = conn.cursor()

    try:
        cur.execute(
            "INSERT INTO users(username, password_hash) VALUES(%s, %s)",
            (username, pw_hash)
        )
    except:
        raise HTTPException(400, "Username already exists")

    return {"status": "ok"}


# ----------------------------------------------------------
# LOGIN (auto-register)
# ----------------------------------------------------------
@router.post("/login")
async def login(request: Request):
    data = await request.json()    # <--- simple JSON body
    username = data["username"]
    password = data["password"]

    cur = conn.cursor()
    cur.execute("SELECT password_hash FROM users WHERE username=%s", (username,))
    row = cur.fetchone()

    if not row:
        pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        cur.execute(
            "INSERT INTO users(username, password_hash) VALUES(%s, %s)",
            (username, pw_hash)
        )
        CURRENT_USERS[username] = time.time()
        return {"status": "registered"}

    stored_hash = row[0].encode()
    if not bcrypt.checkpw(password.encode(), stored_hash):
        raise HTTPException(401, "Invalid password")

    CURRENT_USERS[username] = time.time()
    return {"status": "ok"}


# ----------------------------------------------------------
# HEARTBEAT (keeps user + world alive)
# ----------------------------------------------------------
@router.post("/heartbeat")
def heartbeat(username: str):
    if username in CURRENT_USERS:
        CURRENT_USERS[username] = time.time()

        # Update world too
        if username in PLAYER_WORLD:
            wname = PLAYER_WORLD[username]
            if wname in WORLDS:
                WORLDS[wname]["last_active"] = time.time()

        return {"status": "alive"}

    return {"status": "unknown_user"}


# ----------------------------------------------------------
# JOIN WORLD  (MAIN IMPORTANT PART)
# ----------------------------------------------------------
@router.post("/join_world")
def join_world(username: str, world_name: str = None):
    if username not in CURRENT_USERS:
        raise HTTPException(400, "User not logged in")

    # if world_name was provided, join that one
    if world_name:
        if world_name not in WORLDS:
            raise HTTPException(404, "World does not exist")

        target_world = world_name

    # assign user to target world
    PLAYER_WORLD[username] = target_world
    WORLDS[target_world]["players"].add(username)
    WORLDS[target_world]["last_active"] = time.time()

    port = WORLDS[target_world]["port"]


    return {
        "world_name": target_world,
        "http_url": f"http://{IP}:{port}/hello",
        "ws_url":  f"ws://{IP}:{port}/ws"
    }


@router.post("/leave_world")
def leave_world(username: str):
    if username not in CURRENT_USERS:
        raise HTTPException(400, "User not logged in")

    # Safe lookup
    world = PLAYER_WORLD.get(username)

    if world:
        # Remove from world safely
        if world in WORLDS:
            WORLDS[world]["players"].discard(username)
            WORLDS[world]["last_active"] = time.time()

        # Remove mapping
        PLAYER_WORLD.pop(username, None)

        return {"status": "left", "world": world}

    # If world was already removed or user was cleaned up → still return ok
    return {"status": "already_left", "world": None}


# ----------------------------------------------------------
# GET CURRENT ACTIVE USERS
# ----------------------------------------------------------
@router.get("/current_users")
def current_users():
    return {"current_users": list(CURRENT_USERS.keys())}

# ----------------------------------------------------------
# LEADERBOARD
# ----------------------------------------------------------
@router.get("/leaderboard")
def leaderboard(limit: int = 7):
    cur = conn.cursor(pymysql.cursors.DictCursor)

    cur.execute("""
        SELECT 
            username,
            MAX(max_round) AS max_round,
            MAX(kills) AS kills,
            MAX(survival_time) AS survival_time
        FROM leaderboard
        GROUP BY username
        ORDER BY max_round DESC, kills DESC, survival_time DESC
        LIMIT %s
    """, (limit,))

    rows = cur.fetchall()
    return {"leaderboard": rows}
