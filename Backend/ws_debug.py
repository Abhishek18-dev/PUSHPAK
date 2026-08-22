import struct
import socket
import base64
import os
import time

key = base64.b64encode(os.urandom(16)).decode()
sock = socket.create_connection(('localhost', 8080), timeout=5)
req = (
    'GET /ws/v1/simulations/test123 HTTP/1.1\r\n'
    'Host: localhost:8080\r\n'
    'Upgrade: websocket\r\n'
    'Connection: Upgrade\r\n'
    f'Sec-WebSocket-Key: {key}\r\n'
    'Sec-WebSocket-Version: 13\r\n'
    'Origin: http://localhost:8080\r\n'
    '\r\n'
)
sock.send(req.encode())
resp = sock.recv(4096)
print("=== Handshake Response ===")
print(resp.decode("utf-8", errors="replace"))

# Read WebSocket frame
time.sleep(0.5)
frame_data = sock.recv(4096)
if frame_data:
    opcode = frame_data[0] & 0x0F
    fin = (frame_data[0] >> 7) & 1
    length = frame_data[1] & 0x7F
    payload_start = 2
    if length == 126:
        length = struct.unpack('>H', frame_data[2:4])[0]
        payload_start = 4
    elif length == 127:
        length = struct.unpack('>Q', frame_data[2:10])[0]
        payload_start = 10
    payload = frame_data[payload_start:payload_start + length]
    print(f"=== Frame: fin={fin}, opcode={opcode}, len={length} ===")
    print("Payload: " + payload.decode("utf-8", errors="replace"))
else:
    print("No frame data received")

# Wait for more data (check if server closes)
time.sleep(2)
try:
    sock.settimeout(1)
    more = sock.recv(4096)
    if more:
        op2 = more[0] & 0x0F
        print(f"More data received: {len(more)} bytes, opcode={op2}")
        if op2 == 8:
            close_code = struct.unpack('>H', more[2:4])[0] if len(more) >= 4 else 0
            close_reason = more[4:].decode("utf-8", errors="replace") if len(more) > 4 else ""
            print(f"SERVER SENT CLOSE FRAME: code={close_code}, reason={close_reason}")
    else:
        print("Connection closed by server (empty recv)")
except socket.timeout:
    print("No more data within timeout (connection still alive - GOOD)")
except Exception as e:
    print(f"Error reading more data: {e}")

sock.close()
print("Done.")
