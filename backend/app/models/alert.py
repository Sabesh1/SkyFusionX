import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from app.core.database import Base

class Alert(Base):
    __tablename__ = "alerts"

    alert_id = Column(String, primary_key=True)
    event_id = Column(String, ForeignKey("weather_events.event_id"), nullable=False)
    alert_level = Column(String, nullable=False)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    risk_score = Column(Float)
    generated_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)
    delivery_status = Column(String)
    language = Column(String, default="en")
