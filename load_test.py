import requests
import time

URL = "http://localhost:8000/join"

def join_user(username):
    try:
        r = requests.post(
            URL,
            json={"username": username},
            timeout=3
        )
        return r.json()
    except Exception as e:
        return {"error": str(e)}

print("\n=== 100 USERS JOIN ===\n")


time.sleep(5)
for i in range(100):
    username = f"user{i+1}"
    res = join_user(username)

    world = res.get("world_id")
    pid = res.get("player_id")
    ws  = res.get("ws_url")

    print(f"[{i+1:03}] {username} → world={world}  pid={pid}  ws={ws}")

    # small delay so server doesn’t choke
    time.sleep(0.03)

print("\n⏳ Waiting 12 seconds for world to expire...\n")
time.sleep(12)

print("\n=== USER 101 JOINS ===")
res = join_user("user101")
print(res)
