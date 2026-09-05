from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class ObservationCreate(BaseModel):
    source: str = Field(..., description="Source of the report (IMD, WeatherAPI, Citizen, Social)")
    source_event_id: str = Field(..., description="Unique ID from the source")
    observed_at: datetime
    content: str
    latitude: float
    longitude: float
    city: Optional[str] = None
    state: Optional[str] = None
    media_url: Optional[str] = None
    is_mock: bool = False
    event_type: Optional[str] = "OTHER"
    severity: Optional[int] = 1

class ObservationResponse(ObservationCreate):
    id: str
    ingested_at: datetime
    event_type: Optional[str] = None
    severity: Optional[int] = None
    trust_score: Optional[float] = None
    verification_status: Optional[str] = None
    ml_event_type: Optional[str] = None
    ml_confidence: Optional[float] = None
    verification_recommendation: Optional[str] = None
    model_version: Optional[str] = None
    ml_processed_at: Optional[datetime] = None
    
    # Gemini Evidence Analysis
    gemini_analyzed: bool = False
    image_analyzed: bool = False
    verification_assessment: Optional[str] = None
    gemini_evidence_json: Optional[str] = None  # Raw JSON string from DB
    
    # Phase 5: Location Intelligence
    resolved_city: Optional[str] = None
    resolved_district: Optional[str] = None
    resolved_state: Optional[str] = None
    resolved_latitude: Optional[float] = None
    resolved_longitude: Optional[float] = None
    location_confidence: Optional[float] = None
    location_method: Optional[str] = None
    
    # Phase 5: Duplicate Detection
    is_duplicate: bool = False
    duplicate_group_id: Optional[str] = None
    duplicate_of_id: Optional[str] = None
    duplicate_similarity: Optional[float] = None
    duplicate_reason: Optional[str] = None
    
    class Config:
        from_attributes = True
