import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "National AI Weather Intelligence & Truth Engine"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://weather_admin:weather_password@localhost:5432/weather_db")
    KAFKA_BOOTSTRAP_SERVERS: str = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    
    # Model configuration (for replacing baseline later)
    USE_ML_MODELS: bool = False

    class Config:
        env_file = ".env"

settings = Settings()
