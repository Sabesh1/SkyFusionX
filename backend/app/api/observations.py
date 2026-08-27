from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.core.database import get_db
from app.models.observation import Observation
from app.schemas.observation import ObservationCreate, ObservationResponse
from stream.app import stream_client
from stream import topics

router = APIRouter()

@router.post("", response_model=dict, status_code=202)
async def submit_observation(obs: ObservationCreate):
    # Send to RAW topic
    obs_dict = obs.model_dump()
    obs_dict["observation_id"] = str(uuid.uuid4())
    obs_dict["occurred_at"] = obs_dict["observed_at"].isoformat()
    obs_dict["observed_at"] = obs_dict["observed_at"].isoformat()
    
    await stream_client.send(topics.TOPIC_RAW, obs_dict)
    
    return {"status": "accepted", "observation_id": obs_dict["observation_id"]}

@router.get("", response_model=List[ObservationResponse])
async def list_observations(db: Session = Depends(get_db)):
    observations = db.query(Observation).order_by(Observation.created_at.desc()).limit(100).all()
    return observations

@router.get("/{observation_id}", response_model=ObservationResponse)
async def get_observation(observation_id: str, db: Session = Depends(get_db)):
    obs = db.query(Observation).filter(Observation.id == observation_id).first()
    if not obs:
        raise HTTPException(status_code=404, detail="Observation not found")
    return obs
