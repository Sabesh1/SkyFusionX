"""
Script to seed the backend database with the comprehensive mock data:
- Clustered Weather Events (WeatherEvent)
- Weather Alerts (Alert)
- Citizen & Sensor Reports/Observations (Observation)
"""
import sys
import os
import datetime

# Ensure backend root is on sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.database import SessionLocal, engine, Base
from app.models.weather_event import WeatherEvent
from app.models.alert import Alert
from app.models.observation import Observation
from app.models.location import Location
from app.models.weather_data import WeatherData
from app.models.user import User
from app.core.security import get_password_hash

def seed_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    now = datetime.datetime.now(datetime.timezone.utc)

    print("[Seeding] Populating database with operational mock records...")

    # 0. SEED ADMIN USER
    admin_user = User(
        username="admin",
        hashed_password=get_password_hash("password"),
        role="admin"
    )
    db.add(admin_user)
    db.commit()
    print("[Seeding] Admin user created.")

    # 1. SEED WEATHER EVENTS
    events_data = [
        {
            "event_id": "EVT-TN-01",
            "event_type": "Urban Flooding",
            "title": "Chennai Extreme Rainfall & Severe Urban Flash Inundation",
            "severity": 4,
            "status": "ESCALATING",
            "start_time": now - datetime.timedelta(hours=4),
            "last_observed_at": now - datetime.timedelta(minutes=2),
            "latitude": 13.0827,
            "longitude": 80.2707,
            "affected_area_sq_km": 142.0,
            "report_count": 1248,
            "verified_report_count": 1085,
            "evidence_confidence": 94.0,
            "prediction_probability": 93.0,
            "exposure_score": 88.0,
            "risk_score": 94.0,
            "risk_level": "CRITICAL"
        },
        {
            "event_id": "EVT-TS-01",
            "event_type": "Urban Flooding",
            "title": "Hyderabad Metro Inundation & Arterial Drain Overflows",
            "severity": 3,
            "status": "PEAK",
            "start_time": now - datetime.timedelta(hours=3),
            "last_observed_at": now - datetime.timedelta(minutes=5),
            "latitude": 17.3850,
            "longitude": 78.4867,
            "affected_area_sq_km": 86.0,
            "report_count": 580,
            "verified_report_count": 492,
            "evidence_confidence": 87.0,
            "prediction_probability": 85.0,
            "exposure_score": 79.0,
            "risk_score": 87.0,
            "risk_level": "HIGH"
        },
        {
            "event_id": "EVT-KA-01",
            "event_type": "Thunderstorm",
            "title": "Bengaluru Severe Thunderstorm & Bellandur Lake Surge",
            "severity": 3,
            "status": "EMERGING",
            "start_time": now - datetime.timedelta(hours=2),
            "last_observed_at": now - datetime.timedelta(minutes=8),
            "latitude": 12.9716,
            "longitude": 77.5946,
            "affected_area_sq_km": 64.0,
            "report_count": 420,
            "verified_report_count": 360,
            "evidence_confidence": 85.0,
            "prediction_probability": 82.0,
            "exposure_score": 75.0,
            "risk_score": 82.0,
            "risk_level": "HIGH"
        },
        {
            "event_id": "EVT-MH-01",
            "event_type": "Urban Flooding",
            "title": "Greater Mumbai Coastal Deluge & Railway Underpass Inundation",
            "severity": 4,
            "status": "PEAK",
            "start_time": now - datetime.timedelta(hours=5),
            "last_observed_at": now - datetime.timedelta(minutes=3),
            "latitude": 19.0760,
            "longitude": 72.8777,
            "affected_area_sq_km": 110.0,
            "report_count": 890,
            "verified_report_count": 780,
            "evidence_confidence": 91.0,
            "prediction_probability": 90.0,
            "exposure_score": 86.0,
            "risk_score": 91.0,
            "risk_level": "CRITICAL"
        },
        {
            "event_id": "EVT-OD-01",
            "event_type": "Cyclone",
            "title": "Puri & Coastal Odisha Deep Depression Storm Surge",
            "severity": 3,
            "status": "EMERGING",
            "start_time": now - datetime.timedelta(hours=6),
            "last_observed_at": now - datetime.timedelta(minutes=15),
            "latitude": 19.8135,
            "longitude": 85.8312,
            "affected_area_sq_km": 95.0,
            "report_count": 310,
            "verified_report_count": 275,
            "evidence_confidence": 89.0,
            "prediction_probability": 88.0,
            "exposure_score": 72.0,
            "risk_score": 86.0,
            "risk_level": "HIGH"
        },
        {
            "event_id": "EVT-KL-01",
            "event_type": "Flash Flood",
            "title": "Wayanad & Idukki Hill Slopes Flash Flood & Mudflow Alert",
            "severity": 3,
            "status": "ESCALATING",
            "start_time": now - datetime.timedelta(hours=4),
            "last_observed_at": now - datetime.timedelta(minutes=10),
            "latitude": 11.6854,
            "longitude": 76.1320,
            "affected_area_sq_km": 54.0,
            "report_count": 240,
            "verified_report_count": 210,
            "evidence_confidence": 86.0,
            "prediction_probability": 84.0,
            "exposure_score": 68.0,
            "risk_score": 83.0,
            "risk_level": "HIGH"
        },
        {
            "event_id": "EVT-DL-01",
            "event_type": "Dense Fog",
            "title": "National Capital Region Dense Fog & Air Quality Anomaly",
            "severity": 2,
            "status": "SUBSIDING",
            "start_time": now - datetime.timedelta(hours=8),
            "last_observed_at": now - datetime.timedelta(minutes=30),
            "latitude": 28.6139,
            "longitude": 77.2090,
            "affected_area_sq_km": 180.0,
            "report_count": 185,
            "verified_report_count": 150,
            "evidence_confidence": 78.0,
            "prediction_probability": 75.0,
            "exposure_score": 60.0,
            "risk_score": 72.0,
            "risk_level": "MODERATE"
        }
    ]

    for ev in events_data:
        existing = db.query(WeatherEvent).filter(WeatherEvent.event_id == ev["event_id"]).first()
        if not existing:
            db.add(WeatherEvent(**ev))
    db.commit()
    print(f"[Seeding] Seeded {len(events_data)} Weather Events.")

    # 2. SEED ALERTS
    alerts_data = [
        {
            "alert_id": "ALT-TN-001",
            "event_id": "EVT-TN-01",
            "alert_level": "CRITICAL_ESCALATION",
            "title": "Flash Flood Emergency: Chennai Coastal & Low-Lying Basins",
            "message": "CRITICAL FLOOD ALERT: Severe inundation across Chennai low-lying sectors (Velachery, Tambaram). Water levels >3.5ft. Avoid travel. NDRF helpline active: 1077.",
            "risk_score": 94.0,
            "delivery_status": "DISPATCHED",
            "language": "en"
        },
        {
            "alert_id": "ALT-TS-001",
            "event_id": "EVT-TS-01",
            "alert_level": "HIGH_WARNING",
            "title": "Urban Inundation Warning: Hyderabad Metro Corridor",
            "message": "HEAVY RAIN & INUNDATION WARNING: Hyderabad Begumpet & Kukatpally arterial corridors submerged. Avoid underpasses. Emergency GHMC teams on site.",
            "risk_score": 87.0,
            "delivery_status": "DISPATCHED",
            "language": "en"
        },
        {
            "alert_id": "ALT-MH-001",
            "event_id": "EVT-MH-01",
            "alert_level": "CRITICAL_ESCALATION",
            "title": "High Tide & Deluge Warning: Greater Mumbai Coastal Belt",
            "message": "MUMBAI EMERGENCY ALERT: Kurla railway junction submerged; Hindmata & Andheri Subway closed to traffic. Stay indoors during afternoon tidal swell.",
            "risk_score": 91.0,
            "delivery_status": "DISPATCHED",
            "language": "en"
        }
    ]

    for alt in alerts_data:
        existing = db.query(Alert).filter(Alert.alert_id == alt["alert_id"]).first()
        if not existing:
            db.add(Alert(**alt))
    db.commit()
    print(f"[Seeding] Seeded {len(alerts_data)} Weather Alerts.")

    # 3. SEED OBSERVATIONS — 12 realistic varied cases, no pre-baked AI scores
    # All model_version=None so the real Gemini pipeline processes them fresh
    observations_data = [
        {"id": "REP-CHE-001", "source": "Citizen Mobile App", "source_event_id": "CIT-TN-01",
         "observed_at": now - __import__("datetime").timedelta(minutes=45),
         "ingested_at": now - __import__("datetime").timedelta(minutes=44),
         "content": "Heavy flooding at Velachery main road junction. Water level above 3.5 feet. Multiple vehicles stranded near SRM hospital bus stop. Rain for 2 hours non-stop.",
         "latitude": 12.9815, "longitude": 80.2180, "city": "Chennai", "district": "Chennai",
         "state": "Tamil Nadu", "event_type": "OTHER", "severity": 4, "is_mock": True, "verification_status": "PROCESSING"},
        {"id": "REP-CBE-001", "source": "Citizen Mobile App", "source_event_id": "CIT-TN-03",
         "observed_at": now - __import__("datetime").timedelta(minutes=30),
         "ingested_at": now - __import__("datetime").timedelta(minutes=29),
         "content": "Avinashi road flyover underpass flooded up to 2 feet after 45 minutes of heavy cloudburst. Autorickshaws unable to pass. Water still rising.",
         "latitude": 11.0170, "longitude": 76.9560, "city": "Coimbatore", "district": "Coimbatore",
         "state": "Tamil Nadu", "event_type": "OTHER", "severity": 3, "is_mock": True, "verification_status": "PROCESSING"},
        {"id": "REP-HYD-001", "source": "Municipal Sensor", "source_event_id": "SEN-TS-01",
         "observed_at": now - __import__("datetime").timedelta(minutes=60),
         "ingested_at": now - __import__("datetime").timedelta(minutes=59),
         "content": "Begumpet railway underbridge completely submerged. Rain gauge shows 62mm in 1 hour. Storm drain capacity exceeded.",
         "latitude": 17.4447, "longitude": 78.4664, "city": "Hyderabad", "district": "Hyderabad",
         "state": "Telangana", "event_type": "OTHER", "severity": 3, "is_mock": True, "verification_status": "PROCESSING"},
        {"id": "REP-MDU-001", "source": "Social Media", "source_event_id": "SOC-TN-02",
         "observed_at": now - __import__("datetime").timedelta(minutes=90),
         "ingested_at": now - __import__("datetime").timedelta(minutes=88),
         "content": "Roads completely underwater near west tower street. Sudden thunderstorm deluge. Cannot leave home.",
         "latitude": 9.9195, "longitude": 78.1193, "city": "Madurai", "district": "Madurai",
         "state": "Tamil Nadu", "event_type": "OTHER", "severity": 3, "is_mock": True, "verification_status": "PROCESSING"},
        {"id": "REP-BOM-001", "source": "Citizen Mobile App", "source_event_id": "CIT-MH-01",
         "observed_at": now - __import__("datetime").timedelta(minutes=70),
         "ingested_at": now - __import__("datetime").timedelta(minutes=69),
         "content": "Kurla railway station tracks underwater. Central line suburban trains suspended. Saw 4 feet of water on platform 3.",
         "latitude": 19.0657, "longitude": 72.8794, "city": "Mumbai", "district": "Mumbai Suburban",
         "state": "Maharashtra", "event_type": "OTHER", "severity": 4, "is_mock": True, "verification_status": "PROCESSING"},
        {"id": "REP-BLR-001", "source": "Municipal Sensor", "source_event_id": "SEN-KA-01",
         "observed_at": now - __import__("datetime").timedelta(minutes=20),
         "ingested_at": now - __import__("datetime").timedelta(minutes=19),
         "content": "Outer Ring Road near Ecospace Bellandur waterlogged with 1.5ft water after sudden cloudburst at 11:30 AM.",
         "latitude": 12.9260, "longitude": 77.6762, "city": "Bengaluru", "district": "Bengaluru Urban",
         "state": "Karnataka", "event_type": "OTHER", "severity": 3, "is_mock": True, "verification_status": "PROCESSING"},
        {"id": "REP-VAGUE-001", "source": "Social Media", "source_event_id": "SOC-VAGUE-01",
         "observed_at": now - __import__("datetime").timedelta(minutes=110),
         "ingested_at": now - __import__("datetime").timedelta(minutes=109),
         "content": "Something strange happening outside. Weather is weird today.",
         "latitude": 13.0827, "longitude": 80.2707, "city": "Chennai", "district": "Chennai",
         "state": "Tamil Nadu", "event_type": "OTHER", "severity": 1, "is_mock": True, "verification_status": "PROCESSING"},
        {"id": "REP-SUSP-001", "source": "Social Media", "source_event_id": "SOC-FAKE-01",
         "observed_at": now - __import__("datetime").timedelta(minutes=120),
         "ingested_at": now - __import__("datetime").timedelta(minutes=119),
         "content": "Massive tsunami wave hitting Marina beach right now! 30 feet waves destroying everything!",
         "latitude": 13.0500, "longitude": 80.2824, "city": "Chennai", "district": "Chennai",
         "state": "Tamil Nadu", "event_type": "OTHER", "severity": 4, "is_mock": True, "verification_status": "PROCESSING"},
        {"id": "REP-DEL-001", "source": "Citizen Mobile App", "source_event_id": "CIT-DL-01",
         "observed_at": now - __import__("datetime").timedelta(minutes=150),
         "ingested_at": now - __import__("datetime").timedelta(minutes=149),
         "content": "Extreme heat in Connaught Place area. Temperature above 45 degrees. Several people collapsed near metro gate 7.",
         "latitude": 28.6315, "longitude": 77.2167, "city": "Delhi", "district": "Central Delhi",
         "state": "Delhi", "event_type": "OTHER", "severity": 3, "is_mock": True, "verification_status": "PROCESSING"},
        {"id": "REP-PUN-001", "source": "Citizen Mobile App", "source_event_id": "CIT-MH-02",
         "observed_at": now - __import__("datetime").timedelta(minutes=35),
         "ingested_at": now - __import__("datetime").timedelta(minutes=34),
         "content": "Very strong gusty winds uprooted two trees near Shivaji Nagar depot. Power lines down. Wind feels like 70-80 km/h.",
         "latitude": 18.5308, "longitude": 73.8475, "city": "Pune", "district": "Pune",
         "state": "Maharashtra", "event_type": "OTHER", "severity": 3, "is_mock": True, "verification_status": "PROCESSING"},
        {"id": "REP-CHE-002", "source": "Social Media", "source_event_id": "SOC-TN-CHE-02",
         "observed_at": now - __import__("datetime").timedelta(minutes=42),
         "ingested_at": now - __import__("datetime").timedelta(minutes=41),
         "content": "Massive flood near Velachery road, water level very high. Vehicles stuck.",
         "latitude": 12.9810, "longitude": 80.2175, "city": "Chennai", "district": "Chennai",
         "state": "Tamil Nadu", "event_type": "OTHER", "severity": 3, "is_mock": True, "verification_status": "PROCESSING"},
        {"id": "REP-NORM-001", "source": "Citizen Mobile App", "source_event_id": "CIT-NORM-01",
         "observed_at": now - __import__("datetime").timedelta(minutes=15),
         "ingested_at": now - __import__("datetime").timedelta(minutes=14),
         "content": "Light drizzle in T. Nagar area. Roads slightly wet but traffic moving normally. No major issues visible.",
         "latitude": 13.0358, "longitude": 80.2335, "city": "Chennai", "district": "Chennai",
         "state": "Tamil Nadu", "event_type": "OTHER", "severity": 1, "is_mock": True, "verification_status": "PROCESSING"},
    ]

    from app.models.observation import Observation
    for obs_data in observations_data:
        existing = db.query(Observation).filter(Observation.id == obs_data["id"]).first()
        if not existing:
            db.add(Observation(**obs_data))
    db.commit()
    print(f"[Seeding] Seeded {len(observations_data)} Observations.")

    db.close()
    print("[Seeding] Completed successfully!")

if __name__ == "__main__":
    seed_database()
