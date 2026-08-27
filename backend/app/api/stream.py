import asyncio
from fastapi import APIRouter, Request
from sse_starlette.sse import EventSourceResponse
import json

from stream.app import stream_client
from stream import topics

router = APIRouter()

# For a prototype, we can use an asyncio.Queue to broadcast to connected clients
# In production, we'd use Redis Pub/Sub or similar
clients = set()

async def broadcast_worker():
    """ Listen to risk updates and alerts, and broadcast them """
    # This is a bit tricky to integrate cleanly with aiokafka inside fastapi without complex setup.
    # We will hook into the mock queues or rely on the processor to push to a global queue.
    pass

# We will modify the processor.py to push to this queue
sse_queue = asyncio.Queue()

@router.get("/stream")
async def event_stream(request: Request):
    """ Server-Sent Events stream for real-time frontend updates """
    async def event_generator():
        # Each client gets its own queue if we want to fanout, but for prototype,
        # we can just have one global queue and broadcast, or use a pub/sub pattern.
        # Simple fanout:
        q = asyncio.Queue()
        clients.add(q)
        
        try:
            while True:
                if await request.is_disconnected():
                    break
                
                # Wait for a message
                msg = await q.get()
                yield {
                    "event": "weather_event_update",
                    "id": msg.get("event_id", "EVT-000"),
                    "data": json.dumps(msg)
                }
        finally:
            clients.remove(q)

    return EventSourceResponse(event_generator())

# Add a function to push to all clients
async def push_to_clients(msg: dict):
    # The prompt requires: "version": 4, "risk_score", "risk_level" etc.
    if "version" not in msg:
        msg["version"] = 1
        
    for q in list(clients):
        await q.put(msg)
