import math, random, asyncio
from state import players, items, NEXT_ITEM_ID, MAX_RADIUS

async def item_spawner():
    global NEXT_ITEM_ID

    MAX_ITEMS = 20
    MIN_DIST_FROM_PLAYER = 3.0

    while True:
        await asyncio.sleep(random.uniform(4, 7))

        if len(items) >= MAX_ITEMS:
            continue

        item_type = random.choices(["heal", "bomb"], weights=[0.6, 0.4])[0]

        # try 10 positions
        for _ in range(10):
            angle = random.random() * math.pi * 2
            r = random.uniform(10, MAX_RADIUS)

            x = math.cos(angle) * r
            z = math.sin(angle) * r

            ok = True
            for pid, p in players.items():
                dx = p["x"] - x
                dz = p["z"] - z
                if dx*dx + dz*dz < MIN_DIST_FROM_PLAYER**2:
                    ok = False
                    break

            if ok:
                items[NEXT_ITEM_ID] = {"x": x, "y": 0.5, "z": z, "type": item_type}
                NEXT_ITEM_ID += 1
                break


def item_pickup_check():
    remove_ids = []

    for iid, it in items.items():
        for pid, p in players.items():
            dx = p["x"] - it["x"]
            dz = p["z"] - it["z"]

            if dx*dx + dz*dz < 1.2*1.2:
                if it["type"] == "heal":
                    p["inventory"]["heal"] += 1
                else:
                    p["inventory"]["bomb"] += 1
                remove_ids.append(iid)

    for iid in remove_ids:
        items.pop(iid, None)


async def use_bomb(pid):
    p = players.get(pid)
    if not p:
        return

    if p["inventory"]["bomb"] <= 0:
        return

    p["inventory"]["bomb"] -= 1

    px, pz = p["x"], p["z"]

    R2 = 30
    PLAYER_DAMAGE = random.randint(10, 30)
    NO_SELF_DAMAGE = True

    killed_zombies = []
    damaged_players = []

    from state import zombies

    # damage zombies
    for zid, z in list(zombies.items()):
        dx = z["x"] - px
        dz = z["z"] - pz
        if dx*dx + dz*dz < R2:
            killed_zombies.append(zid)

    for zid in killed_zombies:
        zombies.pop(zid, None)
        p["zkills"] += 1

    # damage players
    for other_pid, other in list(players.items()):
        if other_pid not in players:
            continue
        if other_pid == pid and NO_SELF_DAMAGE:
            continue

        dx = other["x"] - px
        dz = other["z"] - pz

        if dx*dx + dz*dz < R2:
            other["hp"] -= PLAYER_DAMAGE
            damaged_players.append(other_pid)

            if other["hp"] <= 0:
                other["hp"] = 0
                try:
                    await other["ws"].send_json({"type": "death"})
                except:
                    pass
                players.pop(other_pid, None)


def use_heal(pid):
    p = players[pid]
    if p["inventory"]["heal"] <= 0:
        return

    p["inventory"]["heal"] -= 1
    p["hp"] = min(100, p["hp"] + random.randint(10, 30))
