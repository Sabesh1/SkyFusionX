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
        db.rollback()

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
        db.rollback()

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

    # Force success = False to bypass Kafka and run the processing pipeline directly 
    success = False

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
                db.commit()
                db.refresh(obs)
            except Exception as e:
                db.rollback()
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

            # ── Phase 4: AI Analysis & TruthEngine ─────────────────────────
            gemini_res = None
            import hashlib
            img_hash = None
            cached_obs = None
            
            # ONLY use Gemini if there's an image (Multimodal On-Demand)
            if image_bytes:
                img_hash = hashlib.sha256(image_bytes).hexdigest()
                obs.image_hash = img_hash
                
                cached_obs = db.query(Observation).filter(
                    Observation.image_hash == img_hash,
                    Observation.image_analyzed_state == "ANALYZED",
                    Observation.id != obs.id
                ).first()
                
                if cached_obs:
                    logger.info(f"Image {img_hash} already analyzed (cached from {cached_obs.id}). Reusing evidence.")
                    from app.services.gemini_service import GeminiEvidenceResponse
                    import json as _json
                    try:
                        cached_json = _json.loads(cached_obs.gemini_evidence_json) if cached_obs.gemini_evidence_json else {}
                    except _json.JSONDecodeError:
                        cached_json = {}
                        
                    gemini_res = GeminiEvidenceResponse(
                        gemini_analyzed=True,
                        image_analyzed=True,
                        event_type=cached_obs.ml_event_type or obs.event_type or "OTHER",
                        confidence=cached_obs.ml_confidence or 0.8,
                        trust_score=20.0,
                        verification_status=cached_obs.verification_assessment or "EVIDENCE_SUPPORTED",
                        supporting_evidence=cached_json.get("supporting", []),
                        contradicting_evidence=cached_json.get("contradicting", []),
                        evidence_assessment=cached_json.get("assessment", ""),
                        recommendation=cached_obs.verification_recommendation or "AUTO_ACCEPT",
                        reason="Duplicate image detected."
                    )
                    obs.image_analyzed_state = "ANALYZED"
                    obs.is_duplicate = True
                    obs.duplicate_of_id = cached_obs.id
                    obs.duplicate_similarity = 1.0
                    obs.duplicate_reason = "Duplicate image detected."
                else:
                    obs.image_analyzed_state = "ANALYZING"
                    db.commit()
                    
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
                    
                    if gemini_res and gemini_res.image_analyzed:
                        obs.image_analyzed_state = "ANALYZED"
                    else:
                        obs.image_analyzed_state = "ANALYSIS_FAILED"

            if gemini_res:
                obs.gemini_analyzed = True
                obs.image_analyzed = gemini_res.image_analyzed
                obs.ml_confidence = gemini_res.confidence
                obs.ml_event_type = gemini_res.event_type
                obs.verification_recommendation = gemini_res.recommendation
                obs.verification_assessment = gemini_res.verification_status
                obs.model_version = settings.GEMINI_MODEL
                obs.ml_processed_at = datetime.datetime.utcnow()
                obs.gemini_evidence_json = json.dumps({
                    "supporting": gemini_res.supporting_evidence,
                    "contradicting": gemini_res.contradicting_evidence,
                    "assessment": gemini_res.evidence_assessment,
                    "reason": gemini_res.reason,
                    "verification_status": gemini_res.verification_status,
                    "image_analyzed": gemini_res.image_analyzed,
                })
                logger.info(f"Gemini analysis stored for {event_id}.")
            else:
                obs.gemini_analyzed = False
                obs.image_analyzed = False
                obs.model_version = "deterministic"

            # ── Phase 5: Duplicate Detection (moved before TruthEngine) ──────
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
                    if not obs.is_duplicate:
                        obs.is_duplicate = False
            except Exception as e:
                db.rollback()
                logger.warning(f"Duplicate detection failed for {event_id}: {e}")

            # ── Deterministic TruthEngine Processing ─────────────────────────
            # Runs for ALL reports, ensuring core logic is never bypassed
            from app.intelligence.truth_engine import TruthEngine, TruthEvidence
            engine = TruthEngine()
            
            source_score = TruthEngine.SOURCE_SCORES.get(obs.source, 50)
            location_score = 95 if obs.location_confidence and obs.location_confidence > 0.5 else 10
            
            # Genuine timestamp calculation
            time_delta_seconds = abs((obs.ingested_at - obs.observed_at).total_seconds()) if obs.observed_at and obs.ingested_at else 0
            if time_delta_seconds < 3600:
                timestamp_score = 95
            elif time_delta_seconds < 86400:
                timestamp_score = 75
            else:
                timestamp_score = 40
                
            # Genuine weather correlation calculation
            weather_score = 40
            weather_ctx = evidence.get("weather_context")
            if weather_ctx:
                w_desc = (weather_ctx.get("description") or "").lower()
                e_type = (obs.event_type or "").lower()
                if e_type in w_desc:
                    weather_score = 90
                elif ("flood" in e_type and "rain" in w_desc) or \
                     ("heat" in e_type and "clear" in w_desc) or \
                     ("fog" in e_type and "fog" in w_desc) or \
                     ("cyclone" in e_type and "wind" in w_desc) or \
                     ("storm" in e_type and "rain" in w_desc):
                    weather_score = 85
                else:
                    weather_score = 60
                    
            # Genuine nearby and historical calculations
            nearby_count = len(evidence.get("nearby_observations", []))
            nearby_score = 95 if nearby_count >= 3 else 80 if nearby_count > 0 else 40
            
            related_count = len(evidence.get("related_events", []))
            historical_score = 90 if related_count >= 2 else 75 if related_count == 1 else 50
            
            # Incorporate Gemini's trust score if it ran, otherwise default to a neutral media score
            media_score = gemini_res.trust_score if gemini_res else 50
            
            te_evidence = TruthEvidence(
                source=source_score,
                location=location_score,
                timestamp=timestamp_score,
                weather_data=weather_score,
                nearby_reports=nearby_score,
                media=media_score,
                historical=historical_score,
            )
            truth_score = engine.calculate(te_evidence)
            
            obs.trust_score = truth_score.overall
            
            if obs.is_duplicate:
                # Apply penalty for duplicates if not already handled by image hashing
                obs.trust_score = min(obs.trust_score, 20.0)
                obs.verification_assessment = "EVIDENCE_CONFLICTING"
            elif not gemini_res:
                obs.ml_confidence = 0.5
                obs.ml_event_type = obs.event_type or "OTHER"
                obs.verification_recommendation = "AUTO_ACCEPT" if truth_score.overall >= 70 else "REQUIRES_HUMAN_REVIEW"
                
                # Map TruthEngine status to assessment expected by Phase 6
                if truth_score.status in ["HIGH_CONFIDENCE", "MEDIUM_HIGH_CONFIDENCE"]:
                    obs.verification_assessment = "EVIDENCE_SUPPORTED"
                else:
                    obs.verification_assessment = "INSUFFICIENT_EVIDENCE"
                    
                obs.gemini_evidence_json = json.dumps({
                    "supporting": [],
                    "contradicting": [],
                    "assessment": f"Deterministic TruthEngine scored {truth_score.overall}/100 based on calculated evidence metrics.",
                    "reason": truth_score.status,
                    "verification_status": obs.verification_assessment,
                    "image_analyzed": False,
                })
                logger.info(f"TruthEngine processed {event_id} (Gemini bypassed). Score: {truth_score.overall}")

            # ── Phase 6: Finalize & Commit ─────────────────────────────────
            # Derive verification_status from Gemini's assessment (or fallback/duplicate penalty)
            assessment = obs.verification_assessment
            if assessment == "EVIDENCE_SUPPORTED":
                obs.verification_status = "VERIFIED"
            elif assessment == "EVIDENCE_CONFLICTING":
                obs.verification_status = "REJECTED"
            elif assessment in ("INSUFFICIENT_EVIDENCE", "REQUIRES_HUMAN_REVIEW"):
                obs.verification_status = "UNDER_REVIEW"
            else:
                obs.verification_status = "UNVERIFIED"
            db.commit()
            db.refresh(obs)

            # ── Phase 7: Push SSE Update ───────────────────────────────────
            await push_to_clients({
                "type": "report_processed",
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
                "resolved_city": obs.resolved_city,
                "resolved_state": obs.resolved_state,
                "resolved_latitude": obs.resolved_latitude,
                "resolved_longitude": obs.resolved_longitude,
                "location_confidence": obs.location_confidence,
                "is_duplicate": obs.is_duplicate,
                "duplicate_of_id": obs.duplicate_of_id,
                "duplicate_similarity": obs.duplicate_similarity,
            })

            # ── Phase 8: Trigger Fusion & Alert Pipeline ───────────────────
            try:
                from stream.processor import trigger_clustering
                logger.info(f"Triggering clustering/fusion pipeline for {event_id}...")
                await trigger_clustering()
            except Exception as e:
                logger.error(f"Failed to trigger clustering/fusion: {e}")

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
    has_media: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    from sqlalchemy import or_, and_
    from app.services.demo_stream_manager import demo_manager

    query = db.query(Observation)
    
    # No longer filtering out is_mock=True records so that all background-ingested simulated sources appear on page load.
        
    if state and state != "ALL":
        query = query.filter(Observation.state == state)
    if event_type and event_type != "ALL":
        query = query.filter(Observation.event_type == event_type)
    if verification_status and verification_status != "ALL":
        query = query.filter(Observation.verification_status == verification_status)
    if start_date:
        query = query.filter(Observation.observed_at >= start_date)
    if end_date:
        query = query.filter(Observation.observed_at <= end_date)
    if has_media is True:
        query = query.filter(Observation.media_url != None, Observation.media_url != "")
    elif has_media is False:
        query = query.filter((Observation.media_url == None) | (Observation.media_url == ""))

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
    db: Session = Depends(get_db)
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
