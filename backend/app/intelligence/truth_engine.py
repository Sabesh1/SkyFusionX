from dataclasses import dataclass
from typing import Mapping


@dataclass(frozen=True)
class TruthEvidence:
    source: float
    location: float
    timestamp: float
    weather_data: float
    nearby_reports: float
    media: float
    historical: float

    def __post_init__(self):
        for name, val in self.__dict__.items():
            if not 0 <= val <= 100:
                raise ValueError(f"{name} must be 0-100, got {val}")


@dataclass(frozen=True)
class TruthScore:
    overall: float
    factors: Mapping[str, float]
    status: str
    requires_human_review: bool


class TruthEngine:
    WEIGHTS = {
        "source": 0.15,
        "location": 0.15,
        "timestamp": 0.10,
        "weather_data": 0.20,
        "nearby_reports": 0.15,
        "media": 0.15,
        "historical": 0.10,
    }

    SOURCE_SCORES = {
        "IMD": 95,
        "WeatherAPI": 80,
        "Citizen": 50,
        "Social": 30,
    }

    def __init__(self):
        assert abs(sum(self.WEIGHTS.values()) - 1.0) < 1e-9

    def calculate(self, evidence: TruthEvidence) -> TruthScore:
        factors = {
            "source": evidence.source,
            "location": evidence.location,
            "timestamp": evidence.timestamp,
            "weather_data": evidence.weather_data,
            "nearby_reports": evidence.nearby_reports,
            "media": evidence.media,
            "historical": evidence.historical,
        }
        score = sum(factors[name] * weight for name, weight in self.WEIGHTS.items())
        score = round(max(0.0, min(100.0, score)), 2)

        if score >= 85:
            status, human_review = "HIGH_CONFIDENCE", False
        elif score >= 70:
            status, human_review = "MEDIUM_HIGH_CONFIDENCE", False
        elif score >= 40:
            status, human_review = "REQUIRES_HUMAN_REVIEW", True
        else:
            status, human_review = "LOW_CONFIDENCE", True

        return TruthScore(
            overall=score,
            factors=factors,
            status=status,
            requires_human_review=human_review,
        )

    @classmethod
    def from_observation(cls, observation: dict, context: dict = None) -> TruthScore:
        """
        Legacy compatibility method that builds TruthEvidence from observation dict.
        """
        if context is None:
            context = {}

        source_name = observation.get("source", "Citizen")
        source_score = cls.SOURCE_SCORES.get(source_name, 50)

        lat = observation.get("latitude", 0.0)
        lon = observation.get("longitude", 0.0)
        if 8.0 <= lat <= 37.5 and 68.0 <= lon <= 97.5:
            location_score = 95
        else:
            location_score = 10

        timestamp_score = 90

        weather_data_score = context.get("weather_agreement", 75)
        nearby_reports_score = context.get("nearby_corroboration", 50)

        image_analyzed_state = observation.get("image_analyzed_state", "NOT_ANALYZED")
        if image_analyzed_state == "ANALYZED":
            media_score = 90
        elif image_analyzed_state == "ANALYSIS_FAILED":
            media_score = 40
        else:
            media_score = 40

        historical_score = 70

        evidence = TruthEvidence(
            source=source_score,
            location=location_score,
            timestamp=timestamp_score,
            weather_data=weather_data_score,
            nearby_reports=nearby_reports_score,
            media=media_score,
            historical=historical_score,
        )
        return cls().calculate(evidence)
