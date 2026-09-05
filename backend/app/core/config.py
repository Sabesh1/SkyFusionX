import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "National AI Weather Intelligence & Truth Engine"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://weather_admin:weather_password@localhost:5432/weather_db")
    KAFKA_BOOTSTRAP_SERVERS: str = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")

    # Model configuration (for replacing baseline later)
    USE_ML_MODELS: bool = False

    # Real-world weather ingestion settings
    WEATHER_REFRESH_INTERVAL_MINUTES: int = int(os.getenv("WEATHER_REFRESH_INTERVAL_MINUTES", "15"))
    OPEN_METEO_GEOCODING_URL: str = "https://geocoding-api.open-meteo.com/v1/search"
    OPEN_METEO_WEATHER_URL: str = "https://api.open-meteo.com/v1/forecast"
    WEATHER_DATA_STALE_MINUTES: int = int(os.getenv("WEATHER_DATA_STALE_MINUTES", "60"))
    WEATHER_DATA_RECENT_MINUTES: int = int(os.getenv("WEATHER_DATA_RECENT_MINUTES", "15"))

    # Gemini configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
    GEMINI_TIMEOUT_SECONDS: int = int(os.getenv("GEMINI_TIMEOUT_SECONDS", "60"))
    GEMINI_MAX_REPORT_CHARS: int = int(os.getenv("GEMINI_MAX_REPORT_CHARS", "2000"))
    GEMINI_MAX_RETRIES: int = int(os.getenv("GEMINI_MAX_RETRIES", "4"))

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
