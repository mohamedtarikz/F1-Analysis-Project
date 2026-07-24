import time
import socket
import json
import fastf1
import os

cache_path = ".f1_cache"

# 1. Enable cache and load FastF1 session
if not os.path.exists(cache_path):
    os.makedirs(cache_path)
fastf1.Cache.enable_cache('.f1_cache')  # Creates local folder 'f1_cache'

print("Loading FastF1 session data...")
# Load a specific session (Year, Location/Grand Prix, Session Type 'R' = Race)
session = fastf1.get_session(2023, 'Monza', 'R')
session.load(telemetry=True, laps=True, weather=False)

# Get telemetry for driver 55 (Carlos Sainz)
driver_laps = session.laps.pick_driver('55')
telemetry = driver_laps.get_telemetry()

print(f"Loaded {len(telemetry)} high-density records!")

# 2. Set up socket connection to Java backend
JAVA_SERVER_IP = "localhost"
JAVA_SERVER_PORT = 9999

client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
print(f"Connecting to {JAVA_SERVER_IP}:{JAVA_SERVER_PORT}...")

while True:
    try:
        client_socket.connect((JAVA_SERVER_IP, JAVA_SERVER_PORT))
        print("Connected successfully!")
        break
    except socket.error:
        print("Waiting for Java server...")
        time.sleep(1.5)

# 3. Stream data points line-by-line
for _, row in telemetry.iterrows():
    # Construct a rich payload with track coordinates and driver inputs
    record = {
        "driver_number": 55,
        "speed": float(row['Speed']),
        "rpm": int(row['RPM']),
        "n_gear": int(row['nGear']),
        "throttle": float(row['Throttle']),
        "brake": float(row['Brake']),
        "drs": int(row['DRS']),
        "x": float(row['X']),  # Track coordinate X
        "y": float(row['Y']),  # Track coordinate Y
        "time": str(row['Date'])  # Convert Pandas Timestamp to String
    }
    
    json_record = json.dumps(record) + "\n"
    client_socket.sendall(json_record.encode('utf-8'))
    
    print(f"Sent: Speed {record['speed']} km/h | Throttle: {record['throttle']}% | Pos: ({record['x']}, {record['y']})")
    time.sleep(0.1)  # Stream at 100ms intervals
