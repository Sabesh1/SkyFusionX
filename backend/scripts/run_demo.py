import asyncio
import httpx
import random
import uuid
from datetime import datetime, timedelta

API_URL = "http://localhost:8000/api/v1/observations"

# Demo Scenarios
SCENARIOS = [
    {
        "city": "Chennai",
        "state": "Tamil Nadu",
        "lat": 13.08,
        "lon": 80.27,
        "type": "FLOOD",
        "keywords": ["severe waterlogging", "flood in my street", "water entering homes", "submerged cars"]
    },
    {
        "city": "Mumbai",
        "state": "Maharashtra",
        "lat": 19.07,
        "lon": 72.87,
        "type": "RAIN",
        "keywords": ["heavy rain", "downpour", "continuous rain since morning"]
    }
]

SOURCES = ["IMD", "WeatherAPI", "Citizen", "Social"]

async def send_observation(client: httpx.AsyncClient, scenario: dict):
    source = random.choice(SOURCES)
    
    # Slight jitter for location to form a cluster
    lat = scenario["lat"] + random.uniform(-0.05, 0.05)
    lon = scenario["lon"] + random.uniform(-0.05, 0.05)
    
    content = random.choice(scenario["keywords"])
    if source == "IMD":
        content = f"Official report: {scenario['type']} conditions observed."
        
    obs = {
        "source": source,
        "source_event_id": f"SRC-{uuid.uuid4().hex[:6]}",
        "observed_at": datetime.utcnow().isoformat(),
        "content": content,
        "latitude": lat,
        "longitude": lon,
        "city": scenario["city"],
        "state": scenario["state"],
        "is_mock": True
    }
    
    try:
        resp = await client.post(API_URL, json=obs)
        if resp.status_code == 202:
            print(f"[{datetime.utcnow().time()}] Sent observation for {scenario['city']} ({source}) -> {content}")
        else:
            print(f"Failed: {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"Error connecting to API: {e}")

async def main():
    print("Starting demo data generation...")
    print("Note: Ensure the backend is running at http://localhost:8000")
    
    async with httpx.AsyncClient() as client:
        # Initial burst to create clusters
        print("Sending initial burst to create events...")
        for _ in range(15):
            await send_observation(client, SCENARIOS[0]) # Chennai Flood
            await send_observation(client, SCENARIOS[1]) # Mumbai Rain
            await asyncio.sleep(0.1)
            
        print("Initial burst complete. Now trickling updates...")
        
        while True:
            await send_observation(client, random.choice(SCENARIOS))
            await asyncio.sleep(random.uniform(1.0, 3.0))

if __name__ == "__main__":
    asyncio.run(main())
