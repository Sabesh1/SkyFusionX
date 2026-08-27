from app.core.database import Base, engine
# Import models to ensure they are registered with Base
from app.models.observation import Observation
from app.models.weather_event import WeatherEvent
from app.models.alert import Alert

def init_db():
    print("Initializing database schema...")
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("Schema created successfully.")
    except Exception as e:
        print(f"Error creating schema: {e}")
        print("Note: Ensure PostgreSQL is running and PostGIS extension is installed.")
        print("You can install PostGIS via: CREATE EXTENSION postgis;")

if __name__ == "__main__":
    init_db()
