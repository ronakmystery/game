import pymysql
import os

DB_HOST = os.getenv("DB_HOST", "db")
DB_USER = os.getenv("DB_USER", "game")
DB_PASS = os.getenv("DB_PASS", "game123")
DB_NAME = os.getenv("DB_NAME", "game_db")

def get_conn():
    return pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASS,
        database=DB_NAME,
        autocommit=True
    )

def save_stats(username, kills, max_round, survival_time):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO player_stats (username, kills, max_round, survival_time)
        VALUES (%s, %s, %s, %s)
    """, (username, kills, max_round, survival_time))

    cur.close()
    conn.close()
