import os
from typing import Dict, Any
from dataclasses import dataclass


@dataclass
class PredictionFeatures:
    event_severity: int
    report_growth_rate: float
    rainfall_1h: float
    wind_speed: float
    temperature: float
    historical_risk: float
    event_type: str


class PredictionRiskEngine:
    """
    Deterministic baseline with ML-ready architecture.
    XGBoost model can be hot-swapped via the model_path parameter.
    """

    def __init__(self, model_path: str | None = None):
        self.model = None
        self.model_path = model_path
        if model_path and os.path.exists(model_path):
            try:
                import xgboost
                self.model = xgboost.Booster()
                self.model.load_model(model_path)
            except Exception:
                self.model = None

    def _baseline_probability(self, features: PredictionFeatures) -> float:
        """Deterministic baseline (always works)"""
        event_severity = features.event_severity
        report_growth = features.report_growth_rate
        rainfall_1h = features.rainfall_1h
        wind_speed = features.wind_speed
        temperature = features.temperature
        historical_risk = features.historical_risk
        event_type = features.event_type

        # Calculate base probability based on severity (1-5 scales to 20-80 base)
        base_prob = event_severity * 16.0

        # Adjust based on report growth (+/- 15%)
        growth_factor = min(15.0, (report_growth - 2.0) * 3.0)

        # Adjust based on specific weather triggers (+/- 20%)
        weather_factor = 0.0

        if event_type in ["RAIN", "FLOOD", "CYCLONE"]:
            if rainfall_1h > 50:
                weather_factor += 20.0
            elif rainfall_1h > 20:
                weather_factor += 10.0

        if event_type in ["THUNDERSTORM", "CYCLONE", "STRONG_WIND"]:
            if wind_speed > 80:
                weather_factor += 15.0

        if event_type == "HEATWAVE":
            if temperature > 45:
                weather_factor += 20.0

        # Historical factor (+/- 10%)
        hist_factor = (historical_risk - 50.0) * 0.2

        # Final probability
        prob = base_prob + growth_factor + weather_factor + hist_factor

        return max(0.0, min(100.0, round(prob, 1)))

    def predict(self, features: PredictionFeatures) -> float:
        if self.model:
            # XGBoost path
            try:
                import xgboost
                dmatrix = xgboost.DMatrix([[
                    features.event_severity,
                    features.report_growth_rate,
                    features.rainfall_1h,
                    features.wind_speed,
                    features.temperature,
                    features.historical_risk,
                ]])
                return self.model.predict(dmatrix)[0] * 100
            except Exception:
                pass

        # Deterministic baseline (always works)
        return self._baseline_probability(features)


# Legacy compatibility
class PredictionEngine:
    @classmethod
    def predict(cls, event: Dict[str, Any], context: Dict[str, Any] = None) -> float:
        if context is None:
            context = {}

        features = PredictionFeatures(
            event_severity=event.get("severity", 3),
            report_growth_rate=context.get("report_growth_rate", 2.0),
            rainfall_1h=context.get("rainfall_1h", 0.0),
            wind_speed=context.get("wind_speed", 0.0),
            temperature=context.get("temperature", 25.0),
            historical_risk=context.get("historical_risk", 50.0),
            event_type=event.get("event_type", "OTHER"),
        )
        engine = PredictionRiskEngine()
        return engine.predict(features)
