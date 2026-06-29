import time
import requests
import socket
import json

# 1. fetching telemetry from server
print("Fetching data from OpenF1...")
url = "https://api.openf1.org/v1/car_data?driver_number=55&session_key=9159"
response = requests.get(url)
telemetry = response.json()
print(f"Loaded {len(telemetry)} telemetry records")

# 2. set up a local socket to stream to our Java app
JAVA_SERVER_IP = "localhost"
JAVA_SERVER_PORT = 8080

client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
print(f"Connecting to {JAVA_SERVER_IP}:{JAVA_SERVER_PORT}...")

while True:
    try:
        client_socket.connect((JAVA_SERVER_IP, JAVA_SERVER_PORT))
        print(f"Connected to {JAVA_SERVER_IP}:{JAVA_SERVER_PORT} successfully!")
        break
    except socket.error:
        print("Waiting for connection...")
        time.sleep(1.5)

# 3. Emulate live race data (sending every 100ms)
for record in telemetry:
    json_record = json.dumps(record) + "\n"
    client_socket.sendall(json_record.encode('utf-8'))

    print(f"Sent: Driver {record['driver_number']} - Speed: {record['speed']} km/h")
    time.sleep(0.1)