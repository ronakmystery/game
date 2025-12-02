# game/main_game_loop.py

import asyncio
from game.state import game_state, ROUND_DELAY, TICK_RATE
from game.zombies import spawn_zombies, update_zombies
from game.loot import update_loot
from game.network import manager

async def game_loop():
    print("Game loop started.")
    next_round_timer = ROUND_DELAY

    game_state["zombies"] = spawn_zombies(game_state["round"])

    while True:
        await asyncio.sleep(TICK_RATE)

        update_loot()
        update_zombies()

        # next round logic
        if all(not z["alive"] for z in game_state["zombies"]):
            next_round_timer -= TICK_RATE
            if next_round_timer <= 0:
                game_state["round"] += 1
                game_state["zombies"] = spawn_zombies(game_state["round"])
                next_round_timer = ROUND_DELAY

        await manager.broadcast()
