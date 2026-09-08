import base64
import requests
import json
import time
import datetime
import uuid

# Read the image and encode it
with open(r"a:\SkyFusionX\images.jpg", "rb") as f:
    img_b64 = base64.b64encode(f.read()).decode('utf-8')
dummy_img = f"data:image/jpeg;base64,{img_b64}"

payload = {
    "source": "Citizen App",
    "source_event_id": str(uuid.uuid4()),
    "observed_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "content": "Chennai, heavy rain fall, like that",
    "latitude": 13.0827,
    "longitude": 80.2707,
    "city": "Chennai",
    "state": "Tamil Nadu",
    "event_type": "Urban Flooding",
    "severity": 4,
    "media_url": dummy_img
}

print("Submitting observation...")
res = requests.post("http://localhost:8000/api/v1/observations", json=payload)
print(f"Status: {res.status_code}")
data = res.json()
print(data)

obs_id = data.get("observation_id")
if not obs_id:
    exit(1)

# Poll for processing
for i in range(15):
    time.sleep(2)
    poll_res = requests.get(f"http://localhost:8000/api/v1/observations/{obs_id}")
    obs = poll_res.json()
    status = obs.get("verification_status")
    print(f"Poll {i}: Status = {status}, AI Status = {obs.get('ml_event_type')}")
    if status != "PROCESSING":
        print("Final Report:")
        print(json.dumps(obs, indent=2))
        break
