import pytest
from app.intelligence.truth_engine import TruthEngine
from app.intelligence.classifier import Classifier
from app.intelligence.clustering_engine import ClusteringEngine
from app.intelligence.prediction_engine import PredictionEngine
from app.intelligence.risk_engine import RiskEngine

def test_truth_engine_high_confidence():
    obs = {
        "source": "IMD",
        "latitude": 13.08, # Chennai
        "longitude": 80.27,
        "media_url": "http://example.com/image.jpg"
    }
    context = {"weather_agreement": 90, "nearby_corroboration": 90}
    res = TruthEngine.evaluate(obs, context)
    assert res["trust_score"] >= 85
    assert res["status"] == "HIGH_CONFIDENCE"

def test_truth_engine_low_confidence():
    obs = {
        "source": "Social",
        "latitude": 0.0, # Not India
        "longitude": 0.0,
        "media_url": None
    }
    context = {"weather_agreement": 10, "nearby_corroboration": 10}
    res = TruthEngine.evaluate(obs, context)
    assert res["trust_score"] < 40
    assert res["status"] == "LOW_CONFIDENCE"

def test_classifier():
    res1 = Classifier.classify("severe waterlogging and flood in chennai")
    assert res1["event_type"] == "FLOOD"
    assert res1["severity"] >= 4

    res2 = Classifier.classify("light drizzle")
    assert res2["event_type"] == "RAIN"
    assert res2["severity"] == 2

def test_prediction_engine():
    event = {"severity": 4, "event_type": "FLOOD"}
    context = {"report_growth_rate": 5.0, "rainfall_1h": 60.0}
    prob = PredictionEngine.predict(event, context)
    assert prob > 80.0

def test_risk_engine():
    event = {
        "severity": 5, 
        "prediction_probability": 90.0, 
        "evidence_confidence": 90.0,
        "report_count": 20
    }
    res = RiskEngine.calculate_risk(event, {"population_density": 10000})
    assert res["risk_level"] == "CRITICAL"
    assert res["risk_score"] >= 75
