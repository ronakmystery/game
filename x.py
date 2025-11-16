import requests
import time

URL = "http://localhost:8000/join"

print("\n=== 10 USERS JOIN ===")
for i in range(100):
    r = requests.get(URL).json()
    print(f"User {i+1} →", r)

print("\nWaiting 12 seconds for world to expire...")
time.sleep(12)

print("\n=== User 11 joins (this should delete old world + create new one) ===")
print(requests.get(URL).json())
