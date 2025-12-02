# utils.py
import math

def clamp(v, low, high):
    return max(low, min(high, v))

def distance(ax, ay, bx, by):
    return math.sqrt((ax - bx)**2 + (ay - by)**2)
