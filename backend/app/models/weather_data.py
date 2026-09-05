"""
WeatherData — real-world observations fetched from Open-Meteo.
Each record is tied to a stable location_id from the Location master.
"""
import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from app.core.database import Base


class WeatherData(Base):
    __tablename__ = "weather_data"

    id = Column(String, primary_key=True)              # "{location_id}-{unix_ts}"
    location_id = Column(String, ForeignKey("locations.location_id"), nullable=False)
    temperature_c = Column(Float)                      # degrees Celsius
    apparent_temp_c = Column(Float)
    rainfall_mm = Column(Float, default=0.0)           # mm in current hour
    relative_humidity = Column(Float)
    wind_speed_kmh = Column(Float)
    wind_direction_deg = Column(Float)
    weather_code = Column(String)                      # WMO code string
    weather_description = Column(String)               # e.g. "Moderate rain"
    is_day = Column(Float)                             # 0 or 1
    severity = Column(String, default="NORMAL")        # NORMAL | WATCH | WARNING | CRITICAL
    observed_at = Column(DateTime(timezone=True), nullable=False)  # observation time from API
    fetched_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)  # when we pulled it
    source = Column(String, default="open-meteo")
