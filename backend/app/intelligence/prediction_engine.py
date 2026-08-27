from typing import Dict, Any

class PredictionEngine:
    """
    Creates a prototype 3-hour risk prediction.
    Uses a deterministic mathematical baseline that acts as a placeholder for a future trained model.
    """

    @classmethod
    def predict(cls, event: Dict[str, Any], context: Dict[str, Any] = None) -> float:
        """
        Returns a prediction probability (0-100) of worsening conditions in the next 3 hours.
        """
        if context is None:
            context = {}
            
        # Extract features (use context for weather data, event for event specifics)
        event_severity = event.get("severity", 3)
        report_growth = context.get("report_growth_rate", 2.0) # reports per hour
        
        rainfall_1h = context.get("rainfall_1h", 0.0)
        wind_speed = context.get("wind_speed", 0.0)
        temperature = context.get("temperature", 25.0)
        
        historical_risk = context.get("historical_risk", 50.0)
        
        # Calculate base probability based on severity (1-5 scales to 20-80 base)
        base_prob = event_severity * 16.0 
        
        # Adjust based on report growth (+/- 15%)
        # If reports are growing rapidly (>5/hr), increase risk
        growth_factor = min(15.0, (report_growth - 2.0) * 3.0) 
        
        # Adjust based on specific weather triggers (+/- 20%)
        weather_factor = 0.0
        event_type = event.get("event_type", "OTHER")
        
        if event_type in ["RAIN", "FLOOD", "CYCLONE"]:
            if rainfall_1h > 50: # >50mm in 1h is extreme
                weather_factor += 20.0
            elif rainfall_1h > 20:
                weather_factor += 10.0
                
        if event_type in ["THUNDERSTORM", "CYCLONE", "STRONG_WIND"]:
            if wind_speed > 80: # >80 km/h
                weather_factor += 15.0
                
        if event_type == "HEATWAVE":
            if temperature > 45:
                weather_factor += 20.0
                
        # Historical factor (+/- 10%)
        hist_factor = (historical_risk - 50.0) * 0.2
        
        # Final probability
        prob = base_prob + growth_factor + weather_factor + hist_factor
        
        return max(0.0, min(100.0, round(prob, 1)))
