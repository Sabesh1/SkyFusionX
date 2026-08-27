import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime
from geoalchemy2 import Geography
from app.core.database import Base

class WeatherEvent(Base):
    __tablename__ = "weather_events"

    event_id = Column(String, primary_key=True)
    event_type = Column(String, nullable=False)
    title = Column(String)
    severity = Column(Integer)
    status = Column(String)
    start_time = Column(DateTime(timezone=True), nullable=False)
    last_observed_at = Column(DateTime(timezone=True), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location = Column(Geography('POINT', srid=4326))
    affected_area_sq_km = Column(Float)
    report_count = Column(Integer, default=0)
    verified_report_count = Column(Integer, default=0)
    evidence_confidence = Column(Float)
    prediction_probability = Column(Float)
    exposure_score = Column(Float)
    risk_score = Column(Float)
    risk_level = Column(String)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
