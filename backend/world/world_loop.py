import asyncio, math, random, time
from state import players, phase, MAX_RADIUS, AI_PID
from zombies import update_zombies, zombie_damage_check
from items import item_pickup_check
from websocket_handler import broadcast_state


def ai_update():
    if AI_PID not in players:
        return

    ai = players[AI_PID]
    now = time.time()

    if now > ai["move_until"]:
        angle = random.uniform(0, 2 * math.pi)
        ai["vx"] = math.cos(angle) * 0.05
        ai["vz"] = math.sin(angle) * 0.05
        ai["move_until"] = now + random.uniform(1.0, 7.0)

    ai["x"] += ai["vx"]
    ai["z"] += ai["vz"]

    dist_center = math.sqrt(ai["x"]**2 + ai["z"]**2)
    if dist_center > MAX_RADIUS:
        ai["vx"] = -ai["vx"]
        ai["vz"] = -ai["vz"]
        ai["x"] += ai["vx"]
        ai["z"] += ai["vz"]


async def world_loop():
    while True:
        if players and phase == "play":
            ai_update()
            update_zombies()
            await zombie_damage_check()
            item_pickup_check()

        await broadcast_state()
        await asyncio.sleep(0.01)
