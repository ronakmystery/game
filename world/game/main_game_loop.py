import asyncio
from game.state import game_state, ROUND_DELAY, TICK_RATE
from game.zombies import spawn_zombies, update_zombies
from game.loot import update_loot
from game.network import manager
from game.obstacles import random_obstacles

async def game_loop():
    print("Game loop started.")
    next_round_timer = ROUND_DELAY

    game_state["zombies"] = spawn_zombies(game_state["round"])
    game_state["obstacles"] = random_obstacles(30)

    while True:
        await asyncio.sleep(TICK_RATE)

        update_loot()
        update_zombies()

        if all(not z["alive"] for z in game_state["zombies"]):
            if game_state["round_active"]:
                # zombies died THIS tick → round just ended
                game_state["round_active"] = False
                next_round_timer = ROUND_DELAY

            next_round_timer -= TICK_RATE

            if next_round_timer <= 0:
                # new round starts
                game_state["round"] += 1
                game_state["zombies"] = spawn_zombies(game_state["round"])
                game_state["round_active"] = True
                next_round_timer = ROUND_DELAY

        else:
            # round is running normally
            game_state["round_active"] = True


        await manager.broadcast()
