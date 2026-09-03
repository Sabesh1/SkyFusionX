from fastapi import APIRouter
from typing import List, Dict, Any
import httpx
import logging

from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/search", response_model=List[Dict[str, Any]])
async def search_locations(q: str):
    if not q or len(q) < 2:
        return []

    logger.info(f"[Location API] Searching Open-Meteo for '{q}'")
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(settings.OPEN_METEO_GEOCODING_URL, params={
                "name": q,
                "count": 10,
                "language": "en",
                "format": "json",
            })
            resp.raise_for_status()
            data = resp.json()

        results = data.get("results", [])
        
        # Filter for India (country_id = 1269750) and map to response
        india_locations = []
        for r in results:
            if r.get("country_id") == 1269750:
                india_locations.append({
                    "id": r.get("id"),
                    "name": r.get("name"),
                    "state": r.get("admin1", ""),
                    "district": r.get("admin2", r.get("name")),
                    "latitude": r.get("latitude"),
                    "longitude": r.get("longitude"),
                    "type": r.get("feature_code", "")
                })

        # Deduplicate by name + state
        seen = set()
        deduped = []
        for loc in india_locations:
            key = f"{loc['name']}-{loc['state']}"
            if key not in seen:
                seen.add(key)
                deduped.append(loc)

        return deduped[:5]
    except Exception as e:
        logger.error(f"[Location API] Error fetching from Open-Meteo: {e}")
        # Return empty list on failure so UI doesn't crash
        return []
