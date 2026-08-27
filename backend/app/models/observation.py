import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from geoalchemy2 import Geography
from app.core.database import Base

class Observation(Base):
    __tablename__ = "observations"

    id = Column(String, primary_key=True)
    source = Column(String, nullable=False)
    source_event_id = Column(String, nullable=False)
    observed_at = Column(DateTime(timezone=True), nullable=False)
    ingested_at = Column(DateTime(timezone=True), nullable=False)
    content = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location = Column(Geography('POINT', srid=4326))
    city = Column(String)
    district = Column(String)
    state = Column(String)
    event_type = Column(String)
    severity = Column(Integer)
    trust_score = Column(Float)
    verification_status = Column(String)
    media_url = Column(String)
    is_mock = Column(Boolean, default=False)
    raw_payload = Column(JSONB)
    content_hash = Column(String)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('source', 'source_event_id', name='uix_source_event_id'),
    )
