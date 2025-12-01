import requests
import time
import asyncio
import websockets

LOBBY = "http://localhost:8000"


def login(username, password):
    url = f"{LOBBY}/login?username={username}&password={password}"
    r = requests.post(url)
    print("LOGIN:", username, r.json())
    return r.json()


def heartbeat(username):
    url = f"{LOBBY}/heartbeat?username={username}"
    r = requests.post(url)
    print("HEARTBEAT:", username, r.json())


def create_world():
    url = f"{LOBBY}/create_world"
    r = requests.post(url)

    print("RAW RESPONSE:", r.text)   # <-- ADD THIS
    print("STATUS:", r.status_code)  # <-- AND THIS

    print("WORLD CREATED:", r.json())   # <-- This will fail if above is not JSON
    return r.json()



def test_world_http(world_info):
    url = world_info["http_url"]
    print("TEST WORLD HTTP:", url)
    try:
        r = requests.get(url)
        print("WORLD HTTP RESPONSE:", r.json())
    except:
        print("HTTP FAILED")


async def test_world_ws_async(world_info):
    ws = world_info["ws_url"]
    print("TEST WORLD WS:", ws)

    try:
        websocket = await websockets.connect(ws)
        await websocket.send("hello from tester")

        msg = await websocket.recv()
        print("WORLD WS RESPONSE:", msg)

        await websocket.close()

    except Exception as e:
        print("WS FAILED:", e)


def test_world_ws(world_info):
    asyncio.run(test_world_ws_async(world_info))


def main():

    # Create 1 world
    world_info = create_world()
    time.sleep(1)

    # Test HTTP
    test_world_http(world_info)

    # Test WebSocket
    test_world_ws(world_info)


if __name__ == "__main__":
    main()
