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

@router.get("/reverse", response_model=Dict[str, Any])
async def reverse_geocode(lat: float, lng: float):
    logger.info(f"[Location API] Reverse geocoding for lat={lat}, lng={lng}")
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get("https://nominatim.openstreetmap.org/reverse", params={
                "lat": lat,
                "lon": lng,
                "format": "json",
                "addressdetails": 1
            }, headers={"User-Agent": "SkyFusionX/1.0"})
            resp.raise_for_status()
            data = resp.json()

        address = data.get("address", {})
        
        # Nominatim provides various granularity levels
        city = address.get("city") or address.get("town") or address.get("village") or address.get("suburb") or "Unknown"
        district = address.get("county") or address.get("state_district") or city
        state = address.get("state") or "Unknown"
        
        return {
            "name": city,
            "district": district,
            "state": state,
            "latitude": lat,
            "longitude": lng,
            "display_name": data.get("display_name", "")
        }
    except Exception as e:
        logger.error(f"[Location API] Error fetching from Nominatim: {e}")
        # Fallback to unknown if API fails
        return {
            "name": "Current Location",
            "district": "Unknown",
            "state": "Unknown",
            "latitude": lat,
            "longitude": lng,
            "display_name": "Current Location"
        }
