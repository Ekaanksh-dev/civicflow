# check_timing.py
from ai_service import classify_complaint
import time

start = time.time()
result = classify_complaint("there is a pothole on the road")
elapsed = time.time() - start

print(f"Result: {result}")
print(f"Took: {elapsed:.1f} seconds")
