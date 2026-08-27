from typing import Dict, Any

class TruthEngine:
    """
    Explainable Evidence-Based Truth Engine.
    Calculates a transparent Trust Score from seven factors.
    """
    
    # Weights
    WEIGHTS = {
        "source": 0.15,
        "location": 0.15,
        "timestamp": 0.10,
        "weather_data": 0.20,
        "nearby_reports": 0.15,
        "media": 0.15,
        "historical": 0.10
    }

    # Baseline source reliability
    SOURCE_SCORES = {
        "IMD": 95,
        "WeatherAPI": 80,
        "Citizen": 50,
        "Social": 30
    }

    @classmethod
    def evaluate(cls, observation: Dict[str, Any], context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Evaluate an observation and return a trust score and explanation.
        """
        if context is None:
            context = {}

        # 1. Source (15%)
        source_name = observation.get("source", "Citizen")
        source_score = cls.SOURCE_SCORES.get(source_name, 50)

        # 2. Location (15%)
        # Prototype: Checks whether coordinates are geographically plausible for India
        # Rough bounding box for India: Lat 8.0 to 37.5, Lon 68.0 to 97.5
        lat = observation.get("latitude", 0.0)
        lon = observation.get("longitude", 0.0)
        if 8.0 <= lat <= 37.5 and 68.0 <= lon <= 97.5:
            location_score = 95
        else:
            location_score = 10

        # 3. Timestamp (10%)
        # Prototype: Recent timestamps score higher. We'll just assume it's recent for the demo.
        timestamp_score = 90

        # 4. Weather Data Agreement (20%)
        # Prototype: Use available weather observations or demo values
        weather_data_score = context.get("weather_agreement", 75)

        # 5. Nearby Corroboration (15%)
        # Prototype: Passed in via context based on PostGIS query
        nearby_reports_score = context.get("nearby_corroboration", 50)

        # 6. Media (15%)
        # Prototype: media present -> higher evidence
        has_media = bool(observation.get("media_url"))
        media_score = 90 if has_media else 40

        # 7. Historical Consistency (10%)
        # Prototype: deterministic baseline
        historical_score = 70

        # Calculate final score
        raw_score = (
            source_score * cls.WEIGHTS["source"] +
            location_score * cls.WEIGHTS["location"] +
            timestamp_score * cls.WEIGHTS["timestamp"] +
            weather_data_score * cls.WEIGHTS["weather_data"] +
            nearby_reports_score * cls.WEIGHTS["nearby_reports"] +
            media_score * cls.WEIGHTS["media"] +
            historical_score * cls.WEIGHTS["historical"]
        )

        trust_score = max(0, min(100, round(raw_score, 1)))

        # Determine Status
        if trust_score >= 85:
            status = "HIGH_CONFIDENCE"
        elif trust_score >= 70:
            status = "MEDIUM_HIGH_CONFIDENCE"
        elif trust_score >= 40:
            status = "REQUIRES_HUMAN_REVIEW"
        else:
            status = "LOW_CONFIDENCE"

        return {
            "trust_score": trust_score,
            "status": status,
            "evidence": {
                "source": source_score,
                "location": location_score,
                "timestamp": timestamp_score,
                "weather_data": weather_data_score,
                "nearby_reports": nearby_reports_score,
                "media": media_score,
                "historical": historical_score
            }
        }
