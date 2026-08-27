from typing import Dict, Any

class RiskEngine:
    """
    Calculates impact/exposure score and final risk score/level.
    """

    @classmethod
    def calculate_risk(cls, event: Dict[str, Any], context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Calculates risk based on severity, prediction, exposure, and confidence.
        """
        if context is None:
            context = {}
            
        severity = event.get("severity", 3)
        prediction_probability = event.get("prediction_probability", 50.0)
        evidence_confidence = event.get("evidence_confidence", 50.0)
        
        # Calculate exposure (prototype baseline)
        population_density = context.get("population_density", 500) # people/sq km
        report_count = event.get("report_count", 1)
        
        # Exposure score 0-100
        exposure = min(100.0, (population_density / 1000.0 * 30.0) + (report_count * 5.0))
        
        # Risk score formula
        # severity_factor (0.2 to 1.0)
        severity_factor = severity / 5.0
        
        # Normalize prediction and confidence to 0-1
        pred_factor = prediction_probability / 100.0
        conf_factor = evidence_confidence / 100.0
        exp_factor = exposure / 100.0
        
        # Base risk calculation
        # To get a score out of 100, we multiply factors and scale. 
        # But multiplying all <1 factors makes it very small, so we use a weighted average 
        # or geometric mean, or a specific formula that yields a balanced 0-100.
        # The prompt says: risk_score = severity_factor × prediction_probability × exposure × evidence_confidence
        # That would be: (severity/5) * (pred/100) * (exp/100) * (conf/100) which is tiny. 
        # Let's interpret as: risk_score = severity_factor * (0.4*prediction_probability + 0.4*exposure + 0.2*evidence_confidence)
        # OR just straight multiplication of raw values scaled:
        
        raw_risk = severity_factor * prediction_probability * (exposure / 50.0) * (evidence_confidence / 50.0)
        
        # Ensure it's between 0 and 100
        risk_score = max(0.0, min(100.0, round(raw_risk, 1)))
        
        # Determine level
        if risk_score >= 75:
            risk_level = "CRITICAL"
        elif risk_score >= 50:
            risk_level = "HIGH"
        elif risk_score >= 25:
            risk_level = "MODERATE"
        else:
            risk_level = "LOW"
            
        return {
            "exposure_score": round(exposure, 1),
            "risk_score": risk_score,
            "risk_level": risk_level
        }
