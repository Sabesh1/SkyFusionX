"""
AI Copilot API — Location-Aware RAG with Real-World Open-Meteo Data

Flow:
  USER QUERY
    ↓
  Gemini Intent Extraction (Structured Output)
    ↓
  Determine Database / External API Needs
    ↓
  Fetch Context (DB Events/Reports + Open-Meteo)
    ↓
  Gemini Q&A Synthesis
"""
import logging
import datetime
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.weather_event import WeatherEvent
from app.models.observation import Observation
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


# ─── Helpers ───────────────────────────────────────────────────────────────────

def get_national_summary(db: Session) -> Dict[str, Any]:
    events = db.query(WeatherEvent).all()
    critical = [e for e in events if e.risk_level == "CRITICAL"]
    high = [e for e in events if e.risk_level == "HIGH"]
    
    observations = db.query(Observation).all()
    suspicious = [o for o in observations if o.verification_status == "REJECTED" or (o.trust_score and o.trust_score < 50)]
    verified = [o for o in observations if o.verification_status == "VERIFIED"]
    
    event_counts = {}
    for o in observations:
        evt = o.event_type or "OTHER"
        event_counts[evt] = event_counts.get(evt, 0) + 1
        
    top_event_type = max(event_counts.items(), key=lambda x: x[1])[0] if event_counts else "None"
    
    return {
        "total_events": len(events),
        "critical_count": len(critical),
        "high_count": len(high),
        "top_event": events[0] if events else None,
        "total_reports": len(observations),
        "suspicious_reports": len(suspicious),
        "verified_reports": len(verified),
        "top_report_event_type": top_event_type
    }


# ─── Endpoint ──────────────────────────────────────────────────────────────────

@router.post("/chat", response_model=ChatResponse)
async def copilot_chat(request: ChatRequest, db: Session = Depends(get_db)):
    q = request.query
    timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()

    from app.services.gemini_service import gemini_service
    
    # 1. Extract intent via Gemini
    history_dicts = [{"sender": m.sender, "text": m.text} for m in request.history]
    structured_intent = await gemini_service.extract_copilot_intent(q, history=history_dicts)
    
    if structured_intent:
        intent = structured_intent.intent
        params = structured_intent.parameters
    else:
        # Fallback if parsing fails
        intent = "CURRENT_STATUS"
        class FallbackParams:
            location = None
            event_type = None
            severity = None
            verification_status = None
            limit = 10
        params = FallbackParams()

    logger.info(f"\n[Copilot]\nQuestion: {q}\nIntent: {intent}\nParams: {params}")

    response_parts: List[str] = []
    chips: List[SourceChip] = []
    
    loc_name = None
    loc_state = None
    resolved_loc = None
    
    # 2. Location Resolution (if location provided)
    if getattr(params, "location", None):
        resolved_loc = resolve_location(params.location, db)
        if resolved_loc:
            loc_name = resolved_loc["name"]
            loc_state = resolved_loc.get("state", "")
            logger.info(f"[Copilot] Resolved location: {loc_name}, {loc_state}")
        else:
            part = f"**{params.location.title()}** could not be identified as a recognized Indian location.\n"
            response_parts.append(part)
            chips.append(SourceChip(name="Location Unrecognized", type="ai"))

    # 3. External Weather (Open-Meteo)
    if intent in ("EXTERNAL_WEATHER", "MIXED_WEATHER_ANALYSIS") and resolved_loc:
        weather = get_latest_weather(resolved_loc["location_id"], db)
        if not weather or weather.get("age_minutes", 999) > 30:
            fresh = fetch_and_store_weather(resolved_loc, db)
            if fresh:
                weather = get_latest_weather(resolved_loc["location_id"], db)
                
        if weather:
            freshness = weather.get("freshness", "Unknown")
            obs_time = weather.get("observed_at", "")[:16].replace("T", " ") if weather.get("observed_at") else "N/A"
            part = (
                f"**Weather Intelligence for {loc_name}, {loc_state}:**\n\n"
                f"🌡️ **Current Conditions** ({freshness})\n"
                f"• Temperature: **{weather['temperature_c']}°C** (Feels like {weather['apparent_temp_c']}°C)\n"
                f"• Conditions: **{weather['weather_description']}**\n"
                f"• Rainfall: {weather['rainfall_mm']} mm/hr\n"
                f"• Humidity: {weather['humidity']}%\n"
                f"• Wind Speed: {weather['wind_speed_kmh']} km/h\n"
                f"• Severity Assessment: **{weather['severity']}**\n"
                f"• Observed at: {obs_time} IST\n"
                f"• Source: {weather['source']}\n"
            )
            response_parts.append(part)
            chips.append(SourceChip(name=f"Open-Meteo: {freshness}", type="satellite"))
        else:
            response_parts.append(f"⚠️ Real-world weather data is currently unavailable for {loc_name}.\n")
            
    elif intent == "EXTERNAL_WEATHER" and not resolved_loc:
        response_parts.append("A location is required to fetch external weather conditions. Please specify a valid location in India.")

    # 4. Internal Database 
    if intent not in ("EXTERNAL_WEATHER",):
        if intent == "PLATFORM_STATISTICS":
            nat = get_national_summary(db)
            part = (
                "**Platform Statistics:**\n"
                f"• {nat['total_events']} events in database.\n"
                f"• {nat['critical_count']} CRITICAL and {nat['high_count']} HIGH incidents.\n"
                f"• {nat['total_reports']} total citizen reports.\n"
                f"• {nat['verified_reports']} verified reports.\n"
                f"• {nat['suspicious_reports']} suspicious/rejected reports.\n"
                f"• Most reported type: {nat['top_report_event_type']}.\n"
            )
            response_parts.append(part)
            chips.append(SourceChip(name="Application DB", type="stations"))
            
        if intent in ("RECENT_EVENTS", "EVENTS_BY_LOCATION", "EVENTS_BY_TYPE", "HIGH_RISK_EVENTS", "EVENT_DETAILS", "MIXED_WEATHER_ANALYSIS"):
            q_evt = db.query(WeatherEvent)
            all_events = q_evt.all()
            
            if resolved_loc:
                all_events = [e for e in all_events if abs(e.latitude - resolved_loc["lat"]) < 1.2 and abs(e.longitude - resolved_loc["lng"]) < 1.2]
                
            if getattr(params, "severity", None):
                sev = params.severity.upper()
                if sev == "HIGH":
                    all_events = [e for e in all_events if e.risk_level in ("HIGH", "CRITICAL")]
                else:
                    all_events = [e for e in all_events if e.risk_level == sev]
            if intent == "HIGH_RISK_EVENTS":
                all_events = [e for e in all_events if e.risk_level in ("CRITICAL", "HIGH")]
                
            all_events = sorted(all_events, key=lambda x: x.risk_score or 0, reverse=True)
            limit = getattr(params, "limit", 10) or 10
            evt_results = all_events[:limit]
            
            if evt_results:
                part = f"**Internal Weather Events ({len(evt_results)} found):**\n"
                for e in evt_results:
                    part += f"• {e.title or e.event_type} | Risk: {e.risk_level} (Score: {e.risk_score})\n"
                response_parts.append(part)
                chips.append(SourceChip(name="App Events", type="radar"))
            elif intent != "MIXED_WEATHER_ANALYSIS":
                response_parts.append("No matching events are currently present in the platform database.")
                
        if intent in ("RECENT_REPORTS", "LOW_TRUST_REPORTS", "HUMAN_VERIFICATION_QUEUE", "REPORT_DETAILS", "MIXED_WEATHER_ANALYSIS", "EVENTS_BY_LOCATION", "EVENTS_BY_TYPE"):
            q_obs = db.query(Observation)
            if loc_state:
                q_obs = q_obs.filter((Observation.state == loc_state) | (Observation.resolved_state == loc_state))
            if loc_name:
                q_obs = q_obs.filter((Observation.city == loc_name) | (Observation.resolved_city == loc_name))
                
            if intent == "LOW_TRUST_REPORTS":
                q_obs = q_obs.filter((Observation.trust_score < 50) | (Observation.verification_status == "REJECTED"))
            elif intent == "HUMAN_VERIFICATION_QUEUE":
                q_obs = q_obs.filter(Observation.verification_status == "REQUIRES_HUMAN_REVIEW")
            elif getattr(params, "verification_status", None):
                q_obs = q_obs.filter(Observation.verification_status == params.verification_status.upper())
                
            limit = getattr(params, "limit", 10) or 10
            obs_list = q_obs.order_by(Observation.observed_at.desc()).limit(limit).all()
            
            if obs_list:
                part = f"**Recent Citizen Reports ({len(obs_list)} found):**\n"
                for ro in obs_list:
                    part += (
                        f"• {ro.ml_event_type or ro.event_type or 'OTHER'} in {ro.resolved_city or ro.city or 'Unknown'}, {ro.resolved_state or ro.state or 'Unknown'} | "
                        f"Trust: {ro.trust_score or 'N/A'}% | Status: {ro.verification_status} | "
                        f"Report: {(ro.content or '')[:100]}\n"
                    )
                response_parts.append(part)
                chips.append(SourceChip(name=f"{len(obs_list)} Citizen Reports", type="citizen"))
            else:
                response_parts.append("No matching citizen reports are currently present in the platform database.")
                
        else:
            # CURRENT_STATUS or unhandled intent without location
            if not resolved_loc and not getattr(params, "location", None):
                nat = get_national_summary(db)
                part = (
                    "**National Weather Overview (India):**\n"
                    f"• {nat['total_events']} weather events in application database.\n"
                    f"• {nat['critical_count']} CRITICAL and {nat['high_count']} HIGH severity incidents.\n"
                    f"• {nat['total_reports']} total citizen reports in the database.\n"
                    f"• Most reported event type: {nat['top_report_event_type']}.\n"
                )
                response_parts.append(part)
                chips.append(SourceChip(name="Application DB", type="stations"))
            elif resolved_loc:
                 # It's an unhandled intent but we have a location, we shouldn't just say empty if we can fetch something
                 part = f"✅ Location recognized: {loc_name}, {loc_state}. (No specific events or reports fetched for this intent).\n"
                 response_parts.append(part)

    if not response_parts:
        response_parts.append("No relevant data found for your query.")

    full_context = "\n\n---\n\n".join(response_parts)
    
    gemini_answer = await gemini_service.chat_with_context(
        query=q,
        context=full_context,
        history=history_dicts
    )

    return ChatResponse(
        id=f"MSG-AI-{int(datetime.datetime.now().timestamp())}",
        timestamp=timestamp,
        text=gemini_answer,
        sourceChips=chips,
    )
