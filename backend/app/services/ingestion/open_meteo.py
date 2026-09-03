import httpx
import logging
import datetime
from typing import List, Dict, Any
from app.services.ingestion.base import BaseIngestionAdapter
from app.core.config import settings
from app.services.location_service import resolve_location, _wmo_to_description, _rainfall_to_severity
from app.core.database import SessionLocal

logger = logging.getLogger(__name__)

# Configurable list of cities to ingest from
CONFIGURED_CITIES = [
    "Chennai",
    "Mumbai",
    "Delhi",
    "Bengaluru",
    "Hyderabad",
    "Kolkata",
    "Pune",
    "Ahmedabad",
    "Surat",
    "Jaipur"
]

class OpenMeteoAdapter(BaseIngestionAdapter):
    def __init__(self):
        self.cities = CONFIGURED_CITIES

    async def fetch(self) -> List[Dict[str, Any]]:
        db = SessionLocal()
        raw_results = []
        try:
            for city in self.cities:
                loc = resolve_location(city, db)
                if not loc:
                    logger.warning(f"[OpenMeteo] Could not resolve location for {city}")
                    continue
                
                lat, lng = loc["lat"], loc["lng"]
                try:
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        resp = await client.get(settings.OPEN_METEO_WEATHER_URL, params={
                            "latitude": lat,
                            "longitude": lng,
                            "current": [
                                "temperature_2m",
                                "apparent_temperature",
                                "rain",
                                "relative_humidity_2m",
                                "wind_speed_10m",
                                "wind_direction_10m",
                                "weather_code",
                                "is_day",
                            ],
                            "timezone": "Asia/Kolkata",
                        })
                        resp.raise_for_status()
                        data = resp.json()
                        data["_location_ctx"] = loc
                        raw_results.append(data)
                except Exception as e:
                    logger.error(f"[OpenMeteo] Fetch failed for {city}: {e}")
        finally:
            db.close()
            
        return raw_results

    def normalize(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        loc = raw_data.get("_location_ctx")
        current = raw_data.get("current", {})
        
        obs_time_str = current.get("time")
        if not obs_time_str:
            return None
            
        observed_at = datetime.datetime.fromisoformat(obs_time_str).replace(tzinfo=datetime.timezone(datetime.timedelta(hours=5, minutes=30)))
        
        rainfall = current.get("rain", 0.0) or 0.0
        code = current.get("weather_code", 0)
        description = _wmo_to_description(code)
        severity_label = _rainfall_to_severity(rainfall, code)
        
        # Map severity label to int (1-5)
        severity_map = {"CRITICAL": 5, "WARNING": 4, "WATCH": 3, "NORMAL": 1}
        severity = severity_map.get(severity_label, 1)
        
        # Event type
        event_type = "OTHER"
        if rainfall > 0:
            event_type = "Rainfall"
        if code in (95, 96, 99):
            event_type = "Thunderstorm"
        if code in (45, 48):
            event_type = "Fog"
        if current.get("temperature_2m", 0) >= 40:
            event_type = "Heatwave"
            
        temp = current.get('temperature_2m', 0)
        content = f"{description}. Temp: {temp}°C, Rain: {rainfall}mm."

        source_event_id = f"om_{loc['location_id']}_{int(observed_at.timestamp())}"

        return {
            "source": "Open-Meteo",
            "source_type": "api",
            "source_url": settings.OPEN_METEO_WEATHER_URL,
            "source_event_id": source_event_id,
            "observed_at": observed_at,
            "content": content,
            "latitude": loc["lat"],
            "longitude": loc["lng"],
            "city": loc["name"],
            "state": loc["state"],
            "event_type": event_type,
            "severity": severity,
            "verification_status": "VERIFIED", # System API is trusted
            "trust_score": 100.0,
            "raw_payload": raw_data
        }
