import docker
import time
import threading
import random
import string

def random_text(length=6):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

client = docker.from_env()

BASE_PORT = 20000
IDLE_TIMEOUT = 5

# ------------------------------------------------------
# DEV WORLD: Always running, always recreated
# ------------------------------------------------------
DEV_WORLD_NAME = "world_dev"
DEV_WORLD_PORT = 8001

# ============ INTERNAL STORE ============
WORLDS = {}
# ========================================


# ------------------------------------------------------
# ENSURE DEV WORLD EXISTS
# ------------------------------------------------------
def ensure_dev_world():
    """Guarantee dev world container is alive."""
    try:
        container = client.containers.get(DEV_WORLD_NAME)
        if container.status != "running":
            container.start()
    except:
        print("[DEV] Creating dev world...")

        # --- IMPORTANT: BIND TO 0.0.0.0 ---
        client.containers.run(
            "world",
            detach=True,
            name=DEV_WORLD_NAME,
            ports={"8001/tcp": ("0.0.0.0", DEV_WORLD_PORT)},
            restart_policy={"Name": "no"}
        )

    WORLDS[DEV_WORLD_NAME] = {
        "port": DEV_WORLD_PORT,
        "container": DEV_WORLD_NAME,
        "players": set(),
        "last_active": time.time()
    }


# Call immediately on load
ensure_dev_world()


# ------------------------------------------------------
# CREATE NORMAL WORLD
# ------------------------------------------------------
def create_world():
    world_name = "world_" + random_text()
    world_port = BASE_PORT + random.randint(1, 5000)

    # --- IMPORTANT: BIND TO 0.0.0.0 ---
    client.containers.run(
        "world",
        detach=True,
        name=world_name,
        ports={"8001/tcp": ("0.0.0.0", world_port)},
        restart_policy={"Name": "no"}
    )

    WORLDS[world_name] = {
        "port": world_port,
        "container": world_name,
        "players": set(),
        "last_active": time.time()
    }

    return {
        "world_name": world_name,
        "container": world_name,
        "world_port": world_port,
        "http_url": f"http://10.226.221.105:{world_port}/hello",
        "ws_url":   f"ws://10.226.221.105:{world_port}/ws"
    }


# ------------------------------------------------------
# WORLD CLEANUP LOOP
# ------------------------------------------------------
def world_cleanup_loop():
    while True:
        now = time.time()
        dead = []

        for wid, w in list(WORLDS.items()):

            if wid == DEV_WORLD_NAME:
                continue

            if now - w["last_active"] > IDLE_TIMEOUT:
                dead.append(wid)

        for wid in dead:
            cname = WORLDS[wid]["container"]
            try:
                container = client.containers.get(cname)
                container.remove(force=True)
                print(f"[CLEANUP] Deleted idle world {wid}")
            except:
                pass

            del WORLDS[wid]

        ensure_dev_world()

        time.sleep(1)


threading.Thread(target=world_cleanup_loop, daemon=True).start()
