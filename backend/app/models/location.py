"""
Location Master — authoritative India location registry.
Records are populated on-demand by querying Open-Meteo Geocoding API
and cached indefinitely for stable location_id references.
"""
import datetime
from sqlalchemy import Column, String, Float, DateTime, UniqueConstraint
from app.core.database import Base


class Location(Base):
    __tablename__ = "locations"

    location_id = Column(String, primary_key=True)   # e.g. "coimbatore-tamil-nadu-IN"
    name = Column(String, nullable=False)            # "Coimbatore"
    normalized_name = Column(String, nullable=False)  # "coimbatore"
    admin1 = Column(String)                          # State: "Tamil Nadu"
    admin2 = Column(String)                          # District (if available)
    country = Column(String, default="India")
    country_code = Column(String, default="IN")
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_type = Column(String, default="CITY")   # CITY | STATE | DISTRICT
    source = Column(String, default="open-meteo-geocoding")
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("normalized_name", "admin1", name="uq_location_name_state"),
    )
