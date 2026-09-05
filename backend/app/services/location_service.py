"""
India Location Resolution Service
----------------------------------
Handles the TWO-STEP authoritative check:

  1. locationExists(name) -> resolves from cached DB, then Open-Meteo Geocoding API
  2. getLocationData(location_id) -> fetches real-world weather + app events

Architecture enforced:
  LOCATION EXISTS  ≠  DATA AVAILABLE  ≠  ACTIVE EVENT
"""
import hashlib
import logging
import datetime
from typing import Optional, Dict, Any

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.location import Location
from app.models.weather_data import WeatherData

logger = logging.getLogger(__name__)


def _make_location_id(name: str, state: str) -> str:
    """Create a stable, reproducible location_id."""
    raw = f"{name.lower().strip()}-{state.lower().strip()}-IN"
    return raw.replace(" ", "-")


def _wmo_to_description(code: int) -> str:
    """Convert WMO weather code to human-readable string."""
    codes = {
        0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
        45: "Foggy", 48: "Icy fog",
        51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
        61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
        71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
        80: "Slight showers", 81: "Moderate showers", 82: "Violent showers",
        95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Thunderstorm with heavy hail",
    }
    return codes.get(code, f"Weather code {code}")


def _rainfall_to_severity(rainfall_mm: float, code: int) -> str:
    """Derive a simple severity label from Open-Meteo data."""
    if code in (95, 96, 99) or rainfall_mm >= 64.5:
        return "CRITICAL"
    elif code in (80, 81, 82, 65) or rainfall_mm >= 15.6:
        return "WARNING"
    elif code in (61, 63) or rainfall_mm >= 2.5:
        return "WATCH"
    return "NORMAL"


def resolve_location(name: str, db: Session) -> Optional[Dict[str, Any]]:
    """
    Resolve a user-entered location name against:
    1. Local DB cache (Location master)
    2. Open-Meteo Geocoding API (India only, result cached in DB)

    Returns a dict with location details or None if not found.
    """
    normalized = name.lower().strip()

    # 1. Check local cache first
    cached = db.query(Location).filter(
        Location.normalized_name == normalized
    ).first()

    if cached:
        logger.info(f"[Location] Cache HIT for '{name}' -> {cached.location_id}")
        return {
            "location_id": cached.location_id,
            "name": cached.name,
            "state": cached.admin1,
            "country": cached.country,
            "lat": cached.latitude,
            "lng": cached.longitude,
            "type": cached.location_type,
            "source": "local-cache",
        }

    # 2. Query Open-Meteo Geocoding API for India
    logger.info(f"[Location] Cache MISS for '{name}', querying Open-Meteo Geocoding...")
    try:
        with httpx.Client(timeout=8.0) as client:
            resp = client.get(settings.OPEN_METEO_GEOCODING_URL, params={
                "name": name,
                "count": 5,
                "language": "en",
                "format": "json",
            })
            resp.raise_for_status()
            data = resp.json()

        results = data.get("results", [])
        # Filter to India only
        india_results = [r for r in results if r.get("country_code") == "IN"]

        if not india_results:
            logger.info(f"[Location] NOT FOUND in India: '{name}'")
            return None

        best = india_results[0]
        loc_name = best.get("name", name)
        state = best.get("admin1", "")
        loc_id = _make_location_id(loc_name, state)
        loc_type = "CITY" if best.get("feature_code", "").startswith("PP") else "REGION"

        # Cache in DB
        loc = Location(
            location_id=loc_id,
            name=loc_name,
            normalized_name=normalized,
            admin1=state,
            admin2=best.get("admin2"),
            country=best.get("country", "India"),
            country_code="IN",
            latitude=best["latitude"],
            longitude=best["longitude"],
            location_type=loc_type,
            source="open-meteo-geocoding",
        )
        try:
            existing = db.query(Location).filter(Location.location_id == loc_id).first()
            if not existing:
                db.add(loc)
                db.commit()
                db.refresh(loc)
                logger.info(f"[Location] Cached new location: {loc_id}")
            else:
                loc = existing
        except Exception as e:
            db.rollback()
            logger.warning(f"[Location] Could not cache location {loc_id}: {e}")

        return {
            "location_id": loc_id,
            "name": loc_name,
            "state": state,
            "country": best.get("country", "India"),
            "lat": best["latitude"],
            "lng": best["longitude"],
            "type": loc_type,
            "source": "open-meteo-geocoding",
        }

    except Exception as e:
        logger.error(f"[Location] Open-Meteo geocoding error for '{name}': {e}")
        return None


def fetch_and_store_weather(location: Dict[str, Any], db: Session) -> Optional[Dict[str, Any]]:
    """
    Fetch real-world weather from Open-Meteo Forecast API for a resolved location
    and store/update the record in the WeatherData table.

    Returns the weather record dict or None on failure.
    """
    lat, lng = location["lat"], location["lng"]
    loc_id = location["location_id"]

    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(settings.OPEN_METEO_WEATHER_URL, params={
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

        current = data.get("current", {})
        obs_time_str = current.get("time")  # "2024-09-02T14:00"
        observed_at = datetime.datetime.fromisoformat(obs_time_str).replace(tzinfo=datetime.timezone(datetime.timedelta(hours=5, minutes=30)))
        fetched_at = datetime.datetime.now(datetime.timezone.utc)

        rainfall = current.get("rain", 0.0) or 0.0
        code = current.get("weather_code", 0)
        description = _wmo_to_description(code)
        severity = _rainfall_to_severity(rainfall, code)

        record_id = f"{loc_id}-{int(fetched_at.timestamp())}"

        wd = WeatherData(
            id=record_id,
            location_id=loc_id,
            temperature_c=current.get("temperature_2m"),
            apparent_temp_c=current.get("apparent_temperature"),
            rainfall_mm=rainfall,
            relative_humidity=current.get("relative_humidity_2m"),
            wind_speed_kmh=current.get("wind_speed_10m"),
            wind_direction_deg=current.get("wind_direction_10m"),
            weather_code=str(code),
            weather_description=description,
            is_day=current.get("is_day", 1),
            severity=severity,
            observed_at=observed_at,
            fetched_at=fetched_at,
            source="open-meteo",
        )
        db.add(wd)
        db.commit()
        db.refresh(wd)

        return {
            "location_id": loc_id,
            "temperature_c": wd.temperature_c,
            "apparent_temp_c": wd.apparent_temp_c,
            "rainfall_mm": wd.rainfall_mm,
            "humidity": wd.relative_humidity,
            "wind_speed_kmh": wd.wind_speed_kmh,
            "weather_description": wd.weather_description,
            "severity": wd.severity,
            "observed_at": wd.observed_at.isoformat(),
            "fetched_at": wd.fetched_at.isoformat(),
            "source": wd.source,
        }

    except Exception as e:
        logger.error(f"[Weather] Open-Meteo fetch error for {loc_id}: {e}")
        return None


def get_latest_weather(location_id: str, db: Session) -> Optional[Dict[str, Any]]:
    """
    Return the most recent WeatherData record for a location_id,
    along with a freshness label.
    """
    record = (
        db.query(WeatherData)
        .filter(WeatherData.location_id == location_id)
        .order_by(WeatherData.fetched_at.desc())
        .first()
    )

    if not record:
        return None

    now = datetime.datetime.now(datetime.timezone.utc)
    age_minutes = (now - record.fetched_at.replace(tzinfo=datetime.timezone.utc)).total_seconds() / 60

    if age_minutes <= settings.WEATHER_DATA_RECENT_MINUTES:
        freshness = "LIVE"
    elif age_minutes <= settings.WEATHER_DATA_STALE_MINUTES:
        freshness = f"RECENT ({int(age_minutes)} min ago)"
    else:
        freshness = f"STALE ({int(age_minutes)} min ago)"

    return {
        "location_id": record.location_id,
        "temperature_c": record.temperature_c,
        "apparent_temp_c": record.apparent_temp_c,
        "rainfall_mm": record.rainfall_mm,
        "humidity": record.relative_humidity,
        "wind_speed_kmh": record.wind_speed_kmh,
        "weather_description": record.weather_description,
        "severity": record.severity,
        "observed_at": record.observed_at.isoformat() if record.observed_at else None,
        "fetched_at": record.fetched_at.isoformat() if record.fetched_at else None,
        "freshness": freshness,
        "age_minutes": int(age_minutes),
        "source": record.source,
    }
