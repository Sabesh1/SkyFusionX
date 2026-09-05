import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, UniqueConstraint, JSON, Text
from app.core.database import Base

class Observation(Base):
    __tablename__ = "observations"

    id = Column(String, primary_key=True)
    source = Column(String, nullable=False)
    source_type = Column(String)
    source_url = Column(String)
    source_event_id = Column(String, nullable=False)
    observed_at = Column(DateTime(timezone=True), nullable=False)
    ingested_at = Column(DateTime(timezone=True), nullable=False)
    content = Column(String, nullable=False)
    original_text = Column(String)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    city = Column(String)
    district = Column(String)
    state = Column(String)
    event_type = Column(String)
    severity = Column(Integer)
    trust_score = Column(Float)
    ml_confidence = Column(Float)
    ml_event_type = Column(String)
    verification_recommendation = Column(String)
    model_version = Column(String)
    ml_processed_at = Column(DateTime(timezone=True))
    verification_status = Column(String)
    media_url = Column(String)
    is_mock = Column(Boolean, default=False)
    
    # Gemini Evidence Analysis
    gemini_analyzed = Column(Boolean, default=False)         # True only if Gemini actually ran
    image_analyzed = Column(Boolean, default=False)          # True only if image was multimodal analyzed
    gemini_evidence_json = Column(Text, nullable=True)       # JSON: {supporting, contradicting, assessment}
    verification_assessment = Column(String, nullable=True)  # EVIDENCE_SUPPORTED | EVIDENCE_CONFLICTING | INSUFFICIENT_EVIDENCE | REQUIRES_HUMAN_REVIEW
    
    # Phase 5: Location Intelligence
    resolved_city = Column(String)
    resolved_district = Column(String)
    resolved_state = Column(String)
    resolved_latitude = Column(Float)
    resolved_longitude = Column(Float)
    location_confidence = Column(Float)
    location_method = Column(String)
    
    # Phase 5: Duplicate Detection
    is_duplicate = Column(Boolean, default=False)
    duplicate_group_id = Column(String)
    duplicate_of_id = Column(String)
    duplicate_similarity = Column(Float)
    duplicate_reason = Column(String)
    
    raw_payload = Column(JSON)
    content_hash = Column(String)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('source', 'source_event_id', name='uix_source_event_id'),
    )
