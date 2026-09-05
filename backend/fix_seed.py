import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

content = open('seed_db.py', encoding='utf-8').read()
cut_pos = content.find('    observations_data = [')
good_part = content[:cut_pos]

tail = '''    observations_data = [
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
'''

with open('seed_db.py', 'w', encoding='utf-8') as f:
    f.write(good_part + tail)

print(f"Written. Total lines: {(good_part + tail).count(chr(10))}")
