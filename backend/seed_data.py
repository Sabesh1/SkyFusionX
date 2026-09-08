import asyncio
import datetime
import uuid
import json
import os
import sys

# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, Base, engine
from app.models.observation import Observation
from app.models.weather_event import WeatherEvent

def seed():
    # Base.metadata.drop_all(bind=engine)
    # Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Delete existing
    db.query(Observation).delete()
    db.query(WeatherEvent).delete()
    db.commit()

    print("Cleared existing data.")

    now = datetime.datetime.now(datetime.timezone.utc)
    
    # 1. Chennai Heavy Rainfall (High confidence)
    obs1 = Observation(
        id=str(uuid.uuid4()),
        source="citizen_app",
        source_event_id="CIT-1001",
        observed_at=now - datetime.timedelta(hours=1),
        ingested_at=now - datetime.timedelta(minutes=55),
        content="Heavy rainfall in Velachery, streets are starting to flood. Water level is at ankle height.",
        latitude=12.9775,
        longitude=80.2222,
        city="Chennai",
        state="Tamil Nadu",
        event_type="Heavy Rainfall",
        severity=4,
        trust_score=85,
        ml_event_type="Urban Flooding",
        ml_confidence=0.9,
        verification_status="VERIFIED",
        media_url="https://images.unsplash.com/photo-1515694346937-94d85e41e6f0", # generic rain image
        gemini_analyzed=True,
        image_analyzed=True,
        gemini_evidence_json=json.dumps({
            "event_detected": "Heavy Rainfall",
            "image_supports_claim": True,
            "visual_evidence": ["flooded street", "heavy rain", "cars in water"],
            "image_confidence": 95,
            "inconsistencies": [],
            "explanation": "Image clearly shows urban street flooding consistent with heavy rainfall."
        }),
        verification_assessment="EVIDENCE_SUPPORTED",
        resolved_city="Chennai",
        resolved_state="Tamil Nadu",
        location_confidence=0.98,
        is_duplicate=False
    )
    
    # 2. Duplicate of Chennai report
    obs2 = Observation(
        id=str(uuid.uuid4()),
        source="citizen_app",
        source_event_id="CIT-1002",
        observed_at=now - datetime.timedelta(minutes=45),
        ingested_at=now - datetime.timedelta(minutes=40),
        content="Velachery main road flooded due to rain.",
        latitude=12.9780,
        longitude=80.2230,
        city="Chennai",
        state="Tamil Nadu",
        event_type="Heavy Rainfall",
        severity=3,
        trust_score=40,
        ml_event_type="Urban Flooding",
        verification_status="UNDER_REVIEW",
        gemini_analyzed=True,
        image_analyzed=False,
        gemini_evidence_json=json.dumps({
            "explanation": "Text strongly matches recent reports from the same area."
        }),
        verification_assessment="REQUIRES_HUMAN_REVIEW",
        is_duplicate=True,
        duplicate_of_id=obs1.id,
        duplicate_similarity=0.88,
        duplicate_reason="Similar content and location within 15 minutes."
    )
    
    # 3. Delhi Fog (High confidence)
    obs3 = Observation(
        id=str(uuid.uuid4()),
        source="twitter_ingest",
        source_event_id="TWT-2001",
        observed_at=now - datetime.timedelta(hours=2),
        ingested_at=now - datetime.timedelta(hours=1, minutes=50),
        content="Zero visibility near India Gate due to dense fog. Flights delayed.",
        latitude=28.6129,
        longitude=77.2295,
        city="New Delhi",
        state="Delhi",
        event_type="Dense Fog",
        severity=4,
        trust_score=92,
        ml_event_type="Dense Fog",
        ml_confidence=0.95,
        verification_status="VERIFIED",
        gemini_analyzed=True,
        verification_assessment="EVIDENCE_SUPPORTED"
    )
    
    # 4. Rajasthan Heatwave
    obs4 = Observation(
        id=str(uuid.uuid4()),
        source="citizen_app",
        source_event_id="CIT-3001",
        observed_at=now - datetime.timedelta(days=1),
        ingested_at=now - datetime.timedelta(days=1),
        content="Extreme heatwave, temperature feels like 48C in Jodhpur.",
        latitude=26.2389,
        longitude=73.0243,
        city="Jodhpur",
        state="Rajasthan",
        event_type="Heatwave",
        severity=5,
        trust_score=88,
        ml_event_type="Heatwave",
        ml_confidence=0.9,
        verification_status="VERIFIED",
        gemini_analyzed=True,
        verification_assessment="EVIDENCE_SUPPORTED"
    )
    
    # 5. Suspicious snowfall in Chennai
    obs5 = Observation(
        id=str(uuid.uuid4()),
        source="citizen_app",
        source_event_id="CIT-4001",
        observed_at=now - datetime.timedelta(minutes=10),
        ingested_at=now - datetime.timedelta(minutes=5),
        content="It is snowing heavily in Chennai right now! Look at the snow!",
        latitude=13.0827,
        longitude=80.2707,
        city="Chennai",
        state="Tamil Nadu",
        event_type="Snowfall",
        severity=1,
        trust_score=12,
        ml_event_type="OTHER",
        ml_confidence=0.2,
        verification_status="REJECTED",
        gemini_analyzed=True,
        gemini_evidence_json=json.dumps({
            "event_detected": "Snowfall claim",
            "image_supports_claim": False,
            "inconsistencies": ["Snow is meteorologically impossible in Chennai", "Telemetry shows 32C"],
            "explanation": "Claim directly contradicts physical weather models and climatology for the region."
        }),
        verification_assessment="EVIDENCE_CONFLICTING"
    )

    db.add_all([obs1, obs2, obs3, obs4, obs5])

    # Add some weather events
    evt1 = WeatherEvent(
        event_id="EVT-TN-001",
        event_type="Heavy Rainfall",
        title="Chennai Urban Flooding",
        severity=4,
        status="ACTIVE",
        start_time=now - datetime.timedelta(hours=2),
        last_observed_at=now,
        latitude=12.97,
        longitude=80.22,
        affected_area_sq_km=25.5,
        report_count=15,
        verified_report_count=10,
        evidence_confidence=88,
        risk_score=85,
        risk_level="HIGH"
    )
    
    evt2 = WeatherEvent(
        event_id="EVT-DL-001",
        event_type="Dense Fog",
        title="Delhi NCR Zero Visibility Fog",
        severity=4,
        status="ACTIVE",
        start_time=now - datetime.timedelta(hours=5),
        last_observed_at=now,
        latitude=28.61,
        longitude=77.22,
        affected_area_sq_km=150.0,
        report_count=42,
        verified_report_count=35,
        evidence_confidence=94,
        risk_score=75,
        risk_level="HIGH"
    )

    db.add_all([evt1, evt2])
    db.commit()
    print("Seeded database successfully.")

if __name__ == "__main__":
    seed()
