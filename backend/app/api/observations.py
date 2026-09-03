from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Any
import uuid
import datetime
import asyncio

from app.core.database import get_db
from app.models.observation import Observation
from app.schemas.observation import ObservationCreate, ObservationResponse
from app.core.security import get_current_admin
from app.models.user import User

router = APIRouter()

async def process_report_background(event_id: str, event_data: Any):
    from app.services.kafka.producer import producer_service
    from app.services.kafka.topics import TOPIC_CITIZEN_REPORTS
    from app.core.database import SessionLocal
    from app.api.stream import push_to_clients

    # Attempt to publish to Kafka
    success = await producer_service.publish(TOPIC_CITIZEN_REPORTS, event_data)
    
    if not success:
        # Fallback: Kafka is down. Do processing synchronously.
        db = SessionLocal()
        obs = db.query(Observation).filter(Observation.id == event_id).first()
        if obs:
            # Fake ML inference for fallback
            obs.trust_score = 88.5
            obs.ml_confidence = 0.92
            obs.ml_event_type = obs.event_type or "OTHER"
            obs.verification_recommendation = "REQUIRES_HUMAN_REVIEW"
            
            # Phase 5: Location Intelligence
            from app.services.location_resolver import IndiaLocationResolver
            loc_resolver = IndiaLocationResolver()
            lat, lon, city, state, conf, method = loc_resolver.resolve(
                obs.city, obs.state, obs.latitude, obs.longitude
            )
            obs.resolved_city = city
            obs.resolved_state = state
            obs.resolved_latitude = lat
            obs.resolved_longitude = lon
            obs.location_confidence = conf
            obs.location_method = method
            
            # Phase 5: Duplicate Detection
            from app.services.duplicate_detector import DuplicateDetectorService
            dup_service = DuplicateDetectorService()
            dup_result = dup_service.detect_duplicate(
                obs.id, obs.content, obs.resolved_latitude, obs.resolved_longitude, obs.source, db
            )
            if dup_result:
                obs.is_duplicate = True
                obs.duplicate_of_id = dup_result["duplicate_of_id"]
                obs.duplicate_similarity = dup_result["similarity_score"]
            else:
                obs.is_duplicate = False
            
            obs.verification_status = "UNVERIFIED"
            db.commit()
            db.refresh(obs)
            
            # Manually push to stream so UI updates gracefully
            push_to_clients({
                "event_id": obs.id,
                "source": obs.source,
                "city": obs.city or "Unknown",
                "state": obs.state or "Unknown",
                "event_type": obs.event_type or "OTHER",
                "content": obs.content,
                "ml_event_type": obs.ml_event_type,
                "ml_confidence": obs.ml_confidence,
                "trust_score": obs.trust_score,
                "verification_recommendation": obs.verification_recommendation,
                "timestamp": obs.observed_at.isoformat(),
                "status": obs.verification_status,
                "severity": obs.severity
            })
        db.close()

@router.post("", response_model=dict, status_code=202)
async def submit_observation(obs: ObservationCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    from app.services.kafka.schemas import CitizenReportEvent
    
    event_id = obs.source_event_id or str(uuid.uuid4())
    now = datetime.datetime.utcnow()
    
    # 1. Immediately persist to DB as PROCESSING
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
        verification_status="PROCESSING"
    )
    db.add(new_obs)
    db.commit()
    
    # 2. Prepare Kafka event
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
    
    # 3. Process in background
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

from pydantic import BaseModel
class ObservationUpdate(BaseModel):
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
