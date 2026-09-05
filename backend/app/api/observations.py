"""
Observations API
================
Handles citizen report ingestion and the AI evidence-analysis pipeline.

Processing Flow:
  1. Receive report (text + optional base64 image)
  2. Persist as PROCESSING
  3. Background: resolve location → retrieve evidence → call Gemini → update DB → push SSE
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Any
import uuid
import datetime
import asyncio
import json
import base64
import logging

from app.core.database import get_db
from app.models.observation import Observation
from app.schemas.observation import ObservationCreate, ObservationResponse
from app.core.security import get_current_admin
from app.core.config import settings
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter()


# ─── Evidence Retrieval Helper ─────────────────────────────────────────────────

def _gather_evidence(obs: Observation, db: Session) -> dict:
    """
    Retrieve project evidence relevant to this observation BEFORE calling Gemini.
    Only fetches data from our own DB and Open-Meteo (already in DB cache).
    """
    evidence = {
        "weather_context": None,
        "nearby_observations": [],
        "related_events": [],
        "existing_ml": None,
    }

    # 1. Real weather data from location_service (fetches Open-Meteo if not cached)
    try:
        from app.services.location_service import resolve_location, fetch_and_store_weather, get_latest_weather
        from app.core.database import SessionLocal

        city = obs.resolved_city or obs.city or ""
        state = obs.resolved_state or obs.state or ""
        if city:
            loc = resolve_location(f"{city}, {state}", db)
            if loc:
                weather = get_latest_weather(loc["location_id"], db)
                if not weather:
                    weather = fetch_and_store_weather(loc, db)
                evidence["weather_context"] = weather
    except Exception as e:
        logger.warning(f"Evidence: weather retrieval failed: {e}")

    # 2. Nearby citizen observations — same state, last 6 hours, exclude self
    try:
        six_hours_ago = datetime.datetime.utcnow() - datetime.timedelta(hours=6)
        nearby = (
            db.query(Observation)
            .filter(
                Observation.state == (obs.state or obs.resolved_state),
                Observation.observed_at >= six_hours_ago,
                Observation.id != obs.id,
                Observation.is_duplicate == False,
            )
            .order_by(Observation.trust_score.desc().nullslast())
            .limit(5)
            .all()
        )
        evidence["nearby_observations"] = [
            {
                "source": n.source,
                "event_type": n.ml_event_type or n.event_type,
                "trust_score": n.trust_score,
                "verification_status": n.verification_status,
                "content": (n.content or "")[:150],
                "city": n.resolved_city or n.city,
            }
            for n in nearby
        ]
    except Exception as e:
        logger.warning(f"Evidence: nearby observations retrieval failed: {e}")

    # 3. Related weather events from WeatherEvent table if available
    try:
        from app.models.weather_event import WeatherEvent
        events = (
            db.query(WeatherEvent)
            .filter(
                WeatherEvent.state == (obs.state or obs.resolved_state),
            )
            .order_by(WeatherEvent.risk_score.desc().nullslast())
            .limit(3)
            .all()
        )
        evidence["related_events"] = [
            {
                "title": getattr(e, "title", None) or getattr(e, "event_type", "?"),
                "risk_level": getattr(e, "risk_level", None),
                "risk_score": getattr(e, "risk_score", None),
            }
            for e in events
        ]
    except Exception:
        pass  # WeatherEvent table may not exist — silently skip

    # 4. Existing ML outputs (if previously analyzed)
    if obs.ml_event_type or obs.ml_confidence:
        evidence["existing_ml"] = {
            "ml_event_type": obs.ml_event_type,
            "ml_confidence": obs.ml_confidence,
        }

    return evidence


def _decode_image_from_url(media_url: str):
    """
    Decode base64 data URL to bytes + mime_type.
    Returns (bytes, mime_type) or (None, None) if invalid.
    """
    if not media_url or not media_url.startswith("data:"):
        return None, None
    try:
        header, encoded = media_url.split(",", 1)
        # header = "data:image/jpeg;base64"
        mime_type = header.split(":")[1].split(";")[0]
        # Validate MIME type — only allow images
        allowed_mimes = {"image/jpeg", "image/png", "image/webp", "image/gif"}
        if mime_type not in allowed_mimes:
            logger.warning(f"Rejected non-image MIME type: {mime_type}")
            return None, None
        image_bytes = base64.b64decode(encoded)
        # Reject files > 4MB
        if len(image_bytes) > 4 * 1024 * 1024:
            logger.warning("Uploaded image too large (>4MB), skipping multimodal analysis.")
            return None, None
        return image_bytes, mime_type
    except Exception as e:
        logger.warning(f"Failed to decode image from media_url: {e}")
        return None, None


# ─── Core Background Processing Function ──────────────────────────────────────

async def process_report_background(event_id: str, event_data: Any):
    """
    Full AI evidence-fusion pipeline for a single observation.
    
    Flow:
      1. Kafka publish attempt
      2. Fallback: direct processing if Kafka unavailable
      3. Location resolution
      4. Evidence retrieval (weather, nearby obs, events)
      5. Image decoding (if media_url is a base64 data URL)
      6. Gemini evidence analysis (text + optional image)
      7. Duplicate detection
      8. DB update
      9. SSE push
    """
    from app.services.kafka.producer import producer_service
    from app.services.kafka.topics import TOPIC_CITIZEN_REPORTS
    from app.core.database import SessionLocal
    from app.api.stream import push_to_clients

    success = await producer_service.publish(TOPIC_CITIZEN_REPORTS, event_data)

    if not success:
        # Kafka unavailable — run full pipeline directly
        db = SessionLocal()
        try:
            obs = db.query(Observation).filter(Observation.id == event_id).first()
            if not obs:
                logger.error(f"process_report_background: Observation {event_id} not found")
                return

            # ── Phase 1: Location Resolution ───────────────────────────────
            try:
                from app.services.location_resolver import IndiaLocationResolver
                loc_resolver = IndiaLocationResolver()
                loc_result = loc_resolver.resolve(
                    explicit_city=obs.city,
                    explicit_state=obs.state,
                    lat=obs.latitude,
                    lon=obs.longitude
                )
                obs.resolved_city = loc_result.city
                obs.resolved_state = loc_result.state
                obs.resolved_latitude = loc_result.latitude
                obs.resolved_longitude = loc_result.longitude
                obs.location_confidence = loc_result.confidence
                obs.location_method = loc_result.method
                db.flush()
            except Exception as e:
                logger.warning(f"Location resolution failed for {event_id}: {e}")

            # ── Phase 2: Evidence Retrieval ────────────────────────────────
            evidence = _gather_evidence(obs, db)
            logger.info(
                f"Evidence gathered for {event_id}: "
                f"weather={'yes' if evidence['weather_context'] else 'no'}, "
                f"nearby={len(evidence['nearby_observations'])}, "
                f"events={len(evidence['related_events'])}"
            )

            # ── Phase 3: Image Decoding ────────────────────────────────────
            image_bytes, image_mime = None, None
            if obs.media_url:
                image_bytes, image_mime = _decode_image_from_url(obs.media_url)
                if image_bytes:
                    logger.info(f"Image decoded for {event_id}: {image_mime}, {len(image_bytes)} bytes")

            # ── Phase 4: Gemini Evidence Analysis ─────────────────────────
            from app.services.gemini_service import gemini_service
            gemini_res = await gemini_service.analyze_report_with_evidence(
                description=obs.content,
                city=obs.resolved_city or obs.city,
                state=obs.resolved_state or obs.state,
                source_type=obs.source,
                report_timestamp=obs.observed_at.isoformat() if obs.observed_at else None,
                weather_context=evidence["weather_context"],
                nearby_observations=evidence["nearby_observations"],
                related_events=evidence["related_events"],
                existing_ml=evidence["existing_ml"],
                image_data=image_bytes,
                image_mime_type=image_mime,
            )

            if gemini_res:
                obs.gemini_analyzed = True
                obs.image_analyzed = gemini_res.image_analyzed
                obs.trust_score = gemini_res.trust_score
                obs.ml_confidence = gemini_res.confidence
                obs.ml_event_type = gemini_res.event_type
                obs.verification_recommendation = gemini_res.recommendation
                obs.verification_assessment = gemini_res.verification_status
                obs.model_version = settings.GEMINI_MODEL
                obs.ml_processed_at = datetime.datetime.utcnow()
                # Store structured evidence for frontend display
                obs.gemini_evidence_json = json.dumps({
                    "supporting": gemini_res.supporting_evidence,
                    "contradicting": gemini_res.contradicting_evidence,
                    "assessment": gemini_res.evidence_assessment,
                    "reason": gemini_res.reason,
                    "verification_status": gemini_res.verification_status,
                    "image_analyzed": gemini_res.image_analyzed,
                })
                logger.info(
                    f"Gemini analysis stored for {event_id}: "
                    f"event={gemini_res.event_type} trust={gemini_res.trust_score} "
                    f"status={gemini_res.verification_status}"
                )
            else:
                # Fallback — do NOT pretend Gemini ran
                obs.gemini_analyzed = False
                obs.image_analyzed = False
                obs.trust_score = obs.trust_score or 40.0  # Keep existing or set conservative default
                obs.ml_confidence = obs.ml_confidence or 0.4
                obs.ml_event_type = obs.ml_event_type or obs.event_type or "OTHER"
                obs.verification_recommendation = "REQUIRES_HUMAN_REVIEW"
                obs.verification_assessment = "INSUFFICIENT_EVIDENCE"
                obs.model_version = "fallback"
                obs.gemini_evidence_json = json.dumps({
                    "supporting": [],
                    "contradicting": [],
                    "assessment": "Gemini analysis was not available. Results are from fallback heuristics only.",
                    "reason": "AI analysis unavailable — fallback used.",
                    "verification_status": "INSUFFICIENT_EVIDENCE",
                    "image_analyzed": False,
                })
                logger.warning(f"Gemini analysis failed for {event_id} — fallback applied.")

            # ── Phase 5: Duplicate Detection ───────────────────────────────
            try:
                from app.services.duplicate_detector import duplicate_detector
                recent_time = obs.observed_at - datetime.timedelta(hours=2)
                candidates = db.query(Observation).filter(
                    Observation.observed_at >= recent_time,
                    Observation.id != obs.id
                ).all()
                new_report_dict = {
                    "content": obs.content,
                    "latitude": obs.resolved_latitude,
                    "longitude": obs.resolved_longitude,
                    "event_type": obs.event_type,
                    "resolved_city": obs.resolved_city
                }
                dup_result = duplicate_detector.detect_duplicate(new_report_dict, candidates)
                if dup_result.is_duplicate:
                    obs.is_duplicate = True
                    obs.duplicate_of_id = dup_result.duplicate_of_id
                    obs.duplicate_similarity = dup_result.similarity
                else:
                    obs.is_duplicate = False
            except Exception as e:
                logger.warning(f"Duplicate detection failed for {event_id}: {e}")

            # ── Phase 6: Finalize & Commit ─────────────────────────────────
            obs.verification_status = "UNVERIFIED"
            db.commit()
            db.refresh(obs)

            # ── Phase 7: Push SSE Update ───────────────────────────────────
            push_to_clients({
                "event_id": obs.id,
                "source": obs.source,
                "city": obs.city or obs.resolved_city or "Unknown",
                "state": obs.state or obs.resolved_state or "Unknown",
                "event_type": obs.event_type or "OTHER",
                "content": obs.content,
                "ml_event_type": obs.ml_event_type,
                "ml_confidence": obs.ml_confidence,
                "trust_score": obs.trust_score,
                "verification_recommendation": obs.verification_recommendation,
                "verification_assessment": obs.verification_assessment,
                "gemini_analyzed": obs.gemini_analyzed,
                "image_analyzed": obs.image_analyzed,
                "gemini_evidence_json": obs.gemini_evidence_json,
                "timestamp": obs.observed_at.isoformat() if obs.observed_at else None,
                "status": obs.verification_status,
                "severity": obs.severity,
                "model_version": obs.model_version,
                "media_url": obs.media_url,
            })

        except Exception as e:
            logger.error(f"process_report_background fatal error for {event_id}: {e}", exc_info=True)
            try:
                db.rollback()
            except Exception:
                pass
        finally:
            db.close()


# ─── API Endpoints ─────────────────────────────────────────────────────────────

@router.post("", response_model=dict, status_code=202)
async def submit_observation(
    obs: ObservationCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    from app.services.kafka.schemas import CitizenReportEvent

    event_id = obs.source_event_id or str(uuid.uuid4())
    now = datetime.datetime.utcnow()

    new_obs = Observation(
        id=event_id,
        source=obs.source,
        source_event_id=event_id,
        observed_at=obs.observed_at,
        ingested_at=now,
        content=obs.content,
        latitude=obs.latitude,
        longitude=obs.longitude,
        city=obs.city,
        state=obs.state,
        event_type=obs.event_type or "OTHER",
        severity=obs.severity or 1,
        is_mock=obs.is_mock,
        media_url=obs.media_url,
        verification_status="PROCESSING",
        gemini_analyzed=False,
        image_analyzed=False,
    )
    db.add(new_obs)
    db.commit()

    event = CitizenReportEvent(
        event_id=event_id,
        source=obs.source,
        source_event_id=event_id,
        timestamp=obs.observed_at,
        city=obs.city or "Unknown",
        state=obs.state or "Unknown",
        latitude=obs.latitude,
        longitude=obs.longitude,
        event_type=obs.event_type or "OTHER",
        description=obs.content or "",
        verification_status="PROCESSING",
        severity=obs.severity or 1
    )

    background_tasks.add_task(process_report_background, event_id, event)

    return {"status": "accepted", "observation_id": event_id}


@router.get("", response_model=List[ObservationResponse])
async def list_observations(
    state: Optional[str] = None,
    event_type: Optional[str] = None,
    verification_status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Observation)
    if state and state != "ALL":
        query = query.filter(Observation.state == state)
    if event_type and event_type != "ALL":
        query = query.filter(Observation.event_type == event_type)
    if verification_status and verification_status != "ALL":
        query = query.filter(Observation.verification_status == verification_status)

    observations = query.order_by(Observation.created_at.desc()).limit(100).all()
    return observations


@router.get("/{observation_id}", response_model=ObservationResponse)
async def get_observation(observation_id: str, db: Session = Depends(get_db)):
    obs = db.query(Observation).filter(Observation.id == observation_id).first()
    if not obs:
        raise HTTPException(status_code=404, detail="Observation not found")
    return obs


from pydantic import BaseModel as _BaseModel

class ObservationUpdate(_BaseModel):
    verification_status: Optional[str] = None
    event_type: Optional[str] = None
    severity: Optional[int] = None


@router.patch("/{observation_id}", response_model=ObservationResponse)
async def update_observation(
    observation_id: str,
    update_data: ObservationUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    obs = db.query(Observation).filter(Observation.id == observation_id).first()
    if not obs:
        raise HTTPException(status_code=404, detail="Observation not found")

    if update_data.verification_status is not None:
        obs.verification_status = update_data.verification_status
    if update_data.event_type is not None:
        obs.event_type = update_data.event_type
    if update_data.severity is not None:
        obs.severity = update_data.severity

    db.commit()
    db.refresh(obs)
    return obs


@router.delete("/{observation_id}", status_code=204)
async def delete_observation(
    observation_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    obs = db.query(Observation).filter(Observation.id == observation_id).first()
    if not obs:
        raise HTTPException(status_code=404, detail="Observation not found")

    db.delete(obs)
    db.commit()
    return None


@router.post("/{observation_id}/reprocess", response_model=dict, status_code=202)
async def reprocess_observation(
    observation_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Trigger full evidence-fusion re-analysis for an existing observation."""
    obs = db.query(Observation).filter(Observation.id == observation_id).first()
    if not obs:
        raise HTTPException(status_code=404, detail="Observation not found")

    obs.verification_status = "PROCESSING"
    obs.gemini_analyzed = False
    db.commit()

    from app.services.kafka.schemas import CitizenReportEvent
    event = CitizenReportEvent(
        event_id=obs.id,
        source=obs.source,
        source_event_id=obs.source_event_id,
        timestamp=obs.observed_at.isoformat() if isinstance(obs.observed_at, datetime.datetime) else obs.observed_at,
        city=obs.city or "Unknown",
        state=obs.state or "Unknown",
        latitude=obs.latitude,
        longitude=obs.longitude,
        event_type=obs.event_type or "OTHER",
        description=obs.content or "",
        verification_status="PROCESSING",
        severity=obs.severity or 1
    )
    background_tasks.add_task(process_report_background, obs.id, event)

    return {"status": "accepted", "observation_id": obs.id}
