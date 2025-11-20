import math, random, time, asyncio
from state import players, zombies, ZOMBIE_SPEED, NEXT_ZID, MAX_RADIUS

def update_zombies():
    if not players:
        return

    for zid, z in zombies.items():
        nearest_pid = None
        nearest_dist = 999999

        for pid, p in players.items():
            dx = p["x"] - z["x"]
            dz = p["z"] - z["z"]
            dist = math.sqrt(dx*dx + dz*dz)

            if dist < nearest_dist:
                nearest_dist = dist
                nearest_pid = pid

        if nearest_pid is None:
            continue

        px = players[nearest_pid]["x"]
        pz = players[nearest_pid]["z"]

        dx = px - z["x"]
        dz = pz - z["z"]
        dist = math.sqrt(dx*dx + dz*dz) + 1e-6

        speed = z.get("speed", ZOMBIE_SPEED)

        z["x"] += (dx / dist) * speed
        z["z"] += (dz / dist) * speed


async def zombie_damage_check():
    now = time.time()
    dead = []

    for zid, z in zombies.items():
        for pid, p in players.items():
            dx = p["x"] - z["x"]
            dz = p["z"] - z["z"]
            dist = math.sqrt(dx*dx + dz*dz)

            if dist < 1.0:
                if now - p.get("last_hit", 0) > 0.5:
                    p["hp"] -= random.randint(10, 30)
                    p["last_hit"] = now

                    if p["hp"] <= 0:
                        p["hp"] = 0
                        dead.append(pid)

    for pid in dead:
        if pid in players:
            print(f"💀 Player {pid} died")
            try:
                await players[pid]["ws"].send_json({"type": "death"})
            except:
                pass
            players.pop(pid, None)


async def zombie_spawner():
    global NEXT_ZID

    while True:
        await asyncio.sleep(5)

        angle = random.random() * 2 * math.pi
        r = MAX_RADIUS - 1

        x = math.cos(angle) * r
        z = math.sin(angle) * r

        zombies[NEXT_ZID] = {
            "x": x,
            "y": 0.5,
            "z": z,
            "speed": random.uniform(0.01, 0.1),
        }

        print(f"🧟 Spawned zombie {NEXT_ZID} at ({x:.1f}, {z:.1f})")
        NEXT_ZID += 1
