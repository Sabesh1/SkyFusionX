"""
AI Copilot API — Location-Aware RAG with Real-World Open-Meteo Data

Flow:
  USER QUERY
    ↓
  NLP: Extract location (case-insensitive, any city name)
    ↓
  Open-Meteo Geocoding → confirm it is a valid Indian location
    ↓
    ├── VALID   → Fetch real-world weather (Open-Meteo Forecast) + App Events
    └── INVALID → Tell user + National fallback
"""
import logging
import re
import datetime
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.weather_event import WeatherEvent
from app.services.location_service import resolve_location, get_latest_weather, fetch_and_store_weather

router = APIRouter()
logger = logging.getLogger(__name__)


# ─── Schemas ───────────────────────────────────────────────────────────────────

class ChatMsg(BaseModel):
    sender: str
    text: str
    timestamp: Optional[str] = None

class ChatRequest(BaseModel):
    query: str
    history: List[ChatMsg] = []

class SourceChip(BaseModel):
    name: str
    type: str

class ChatResponse(BaseModel):
    id: str
    sender: str = "assistant"
    timestamp: str
    text: str
    sourceChips: List[SourceChip] = []
    relatedEventId: Optional[str] = None


# ─── NLP helpers ───────────────────────────────────────────────────────────────

def extract_intent(query: str) -> str:
    q = query.lower()
    if any(w in q for w in ["recommend", "action", "should i", "what to do", "advisory"]):
        return "RECOMMENDED_ACTIONS"
    if any(w in q for w in ["lowest trust", "fake", "suspicious", "misinformation", "rejected"]):
        return "LOW_TRUST_REPORTS"
    return "CURRENT_STATUS"


# Common English stop-words that should not be interpreted as city names
STOP_WORDS = {
    "what", "when", "where", "which", "why", "how", "the", "is", "are",
    "was", "has", "any", "and", "for", "but", "not", "about", "this",
    "that", "there", "here", "now", "today", "tell", "show", "give",
    "happening", "going", "situation", "weather", "risk", "event", "alert",
    "status", "update", "currently", "latest", "recent",
}

def extract_locations(query: str) -> List[str]:
    """
    Extract candidate location names from the query.
    Works for both title-case ("Chennai") and lowercase ("karur", "salem").
    """
    q = query.strip()
    candidates: List[str] = []

    # Pattern 1: "in/for/about/at/near X" — case-insensitive
    prep_matches = re.findall(
        r'\b(?:in|for|about|at|near|around|of)\s+([a-zA-Z][a-zA-Z\s]{1,25}?)(?=\s*\?|\s*$|\s*,|\s+and\b|\s+or\b)',
        q, re.IGNORECASE
    )
    for m in prep_matches:
        word = m.strip()
        if word.lower() not in STOP_WORDS and len(word) >= 3:
            candidates.append(word)

    # Pattern 2: "compare X and Y"
    cmp = re.findall(r'\b(?:compare|vs|versus)\s+([a-zA-Z]+)\s+and\s+([a-zA-Z]+)', q, re.IGNORECASE)
    for pair in cmp:
        candidates.extend(list(pair))

    # Pattern 3: bare alphabetic-only words not in stop-words (no digits → avoids XYZ123)
    if not candidates:
        words = re.findall(r'\b([A-Za-z]{3,})\b', q)
        for w in words:
            if w.lower() not in STOP_WORDS:
                candidates.append(w)

    # Deduplicate preserving order
    seen = set()
    result = []
    for c in candidates:
        key = c.lower()
        if key not in seen:
            seen.add(key)
            result.append(c)
    return result


def resolve_context_location(history: List[ChatMsg]) -> Optional[str]:
    """Pick the last user-mentioned location for follow-up questions."""
    for msg in reversed(history):
        if msg.sender == "user":
            locs = extract_locations(msg.text)
            if locs:
                return locs[0]
    return None


def get_national_summary(db: Session) -> Dict[str, Any]:
    events = db.query(WeatherEvent).all()
    critical = [e for e in events if e.risk_level == "CRITICAL"]
    high = [e for e in events if e.risk_level == "HIGH"]
    return {
        "total_events": len(events),
        "critical_count": len(critical),
        "high_count": len(high),
        "top_event": events[0] if events else None,
    }


# ─── Endpoint ──────────────────────────────────────────────────────────────────

@router.post("/chat", response_model=ChatResponse)
async def copilot_chat(request: ChatRequest, db: Session = Depends(get_db)):
    q = request.query
    intent = extract_intent(q)
    timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()

    # Handle follow-up ("what about there", "is it risky")
    is_followup = any(w in q.lower() for w in ["there", " it ", "same place", "that place"])
    locs = extract_locations(q)
    if (is_followup or not locs) and request.history:
        ctx = resolve_context_location(request.history)
        if ctx:
            locs = [ctx]

    logger.info(f"\n[Copilot]\nQuestion: {q}\nIntent: {intent}\nExtracted locations: {locs}")

    # ── NATIONAL query ─────────────────────────────────────────────────────────
    if not locs or q.lower().strip() in ("india", "national overview"):
        nat = get_national_summary(db)
        lines = [
            "**National Weather Overview (India):**\n",
            f"• {nat['total_events']} weather events in application database.",
            f"• {nat['critical_count']} CRITICAL and {nat['high_count']} HIGH severity incidents.",
        ]
        if nat["top_event"]:
            e = nat["top_event"]
            lines.append(f"• Highest priority: {e.title or e.event_type} (Risk: {e.risk_score})")
        full_context = "\n".join(lines)
        
        from app.services.gemini_service import gemini_service
        gemini_answer = await gemini_service.chat_with_context(
            query=q,
            context=full_context,
            history=[{"sender": m.sender, "text": m.text} for m in request.history]
        )

        return ChatResponse(
            id=f"MSG-AI-{int(datetime.datetime.now().timestamp())}",
            timestamp=timestamp,
            text=gemini_answer,
            sourceChips=[SourceChip(name="Application DB", type="stations")],
        )

    # ── LOCATION-SPECIFIC queries ──────────────────────────────────────────────
    response_parts: List[str] = []
    chips: List[SourceChip] = []

    for raw_loc in locs[:2]:
        logger.info(f"[Copilot] Resolving: '{raw_loc}'")

        # STEP 1 — Confirm location exists in India (Open-Meteo Geocoding)
        resolved = resolve_location(raw_loc, db)

        if not resolved:
            # CASE C: Unrecognized location
            nat = get_national_summary(db)
            logger.info(f"[Copilot] '{raw_loc}' NOT found in India.")
            part = (
                f"**{raw_loc.title()}** could not be identified as a recognized Indian location.\n\n"
                f"---\n**National-level overview (NOT specific to {raw_loc.title()}):**\n"
                f"• {nat['total_events']} events in the application database.\n"
                f"• {nat['critical_count']} CRITICAL incidents."
            )
            response_parts.append(part)
            chips.append(SourceChip(name="National Fallback", type="ai"))
            continue

        loc_name = resolved["name"]
        loc_state = resolved.get("state", "")
        loc_id = resolved["location_id"]
        logger.info(f"[Copilot] Resolved: {loc_name}, {loc_state} (ID: {loc_id})")

        # STEP 2 — Fetch real-world weather (try fresh, fall back to cached)
        weather = get_latest_weather(loc_id, db)
        # Fetch fresh if missing or older than 30 minutes
        if not weather or weather.get("age_minutes", 999) > 30:
            logger.info(f"[Copilot] Fetching fresh Open-Meteo weather for {loc_name}...")
            fresh = fetch_and_store_weather(resolved, db)
            if fresh:
                weather = get_latest_weather(loc_id, db)

        # STEP 3 — Fetch application events near this location (geo-match)
        all_events = db.query(WeatherEvent).all()
        loc_events = [
            e for e in all_events
            if abs(e.latitude - resolved["lat"]) < 1.2 and abs(e.longitude - resolved["lng"]) < 1.2
        ]
        logger.info(f"[Copilot] App events near {loc_name}: {len(loc_events)}")

        # STEP 4 — Synthesize response
        part = f"**Weather Intelligence for {loc_name}, {loc_state}:**\n\n"

        if weather:
            freshness = weather.get("freshness", "Unknown")
            obs_time = weather.get("observed_at", "")[:16].replace("T", " ") if weather.get("observed_at") else "N/A"
            part += (
                f"🌡️ **Current Conditions** ({freshness})\n"
                f"• Temperature: **{weather['temperature_c']}°C** (Feels like {weather['apparent_temp_c']}°C)\n"
                f"• Conditions: **{weather['weather_description']}**\n"
                f"• Rainfall: {weather['rainfall_mm']} mm/hr\n"
                f"• Humidity: {weather['humidity']}%\n"
                f"• Wind Speed: {weather['wind_speed_kmh']} km/h\n"
                f"• Severity Assessment: **{weather['severity']}**\n"
                f"• Observed at: {obs_time} IST\n"
                f"• Source: {weather['source']}\n\n"
            )
            chips.append(SourceChip(name=f"Open-Meteo: {freshness}", type="satellite"))
        else:
            part += "⚠️ Real-world weather data is currently unavailable for this location.\n\n"

        if loc_events:
            evt = loc_events[0]
            if intent == "RECOMMENDED_ACTIONS":
                part += (
                    f"🚨 **Active Application Event:** {evt.title or evt.event_type}\n"
                    f"• Risk Level: {evt.risk_level}\n"
                    f"• **Recommended Action:** Activate district emergency protocols and coordinate evacuation of low-lying zones.\n"
                )
            else:
                part += (
                    f"🚨 **Active Application Event:** {evt.title or evt.event_type}\n"
                    f"• Risk Level: {evt.risk_level} | Risk Score: {evt.risk_score}\n"
                    f"• Verified Reports: {evt.verified_report_count}/{evt.report_count}\n"
                )
            chips.append(SourceChip(name=f"App Event: {evt.risk_level}", type="radar"))
        elif weather and weather["severity"] in ("WARNING", "CRITICAL"):
            part += f"⚠️ No specific application event for {loc_name}, but real-world conditions indicate **{weather['severity']}** weather. Exercise caution.\n"
        else:
            part += f"✅ No active weather events are currently recorded in the application database for {loc_name}.\n"

        response_parts.append(part)

    full_context = "\n\n---\n\n".join(response_parts)
    
    from app.services.gemini_service import gemini_service
    gemini_answer = await gemini_service.chat_with_context(
        query=q,
        context=full_context,
        history=[{"sender": m.sender, "text": m.text} for m in request.history]
    )

    return ChatResponse(
        id=f"MSG-AI-{int(datetime.datetime.now().timestamp())}",
        timestamp=timestamp,
        text=gemini_answer,
        sourceChips=chips,
    )
