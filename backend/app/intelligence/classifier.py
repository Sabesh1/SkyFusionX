from typing import Dict, Any

class Classifier:
    """
    Classifies weather events based on keywords and determines severity.
    """
    
    EVENT_TYPES = [
        "RAIN", "FLOOD", "THUNDERSTORM", "HEATWAVE", "FOG", 
        "DUST_STORM", "STRONG_WIND", "CYCLONE", "HAIL", 
        "LIGHTNING", "LANDSLIDE", "OTHER"
    ]

    KEYWORD_MAP = {
        "FLOOD": ["flood", "submerged", "waterlogging", "inundation"],
        "RAIN": ["rain", "heavy rain", "downpour", "drizzle", "showers"],
        "THUNDERSTORM": ["thunder", "thunderstorm", "squall"],
        "HEATWAVE": ["hot", "extreme heat", "temperature", "heatwave", "scorching"],
        "STRONG_WIND": ["wind", "storm", "gale", "gusts"],
        "CYCLONE": ["cyclone", "hurricane", "typhoon"],
        "HAIL": ["hail", "hailstorm"],
        "LIGHTNING": ["lightning", "strikes"],
        "LANDSLIDE": ["landslide", "mudslide", "rockfall"],
        "FOG": ["fog", "smog", "poor visibility"],
        "DUST_STORM": ["dust", "dust storm", "sandstorm"]
    }

    SEVERITY_KEYWORDS = {
        5: ["extreme", "severe", "devastating", "catastrophic", "cyclone", "hurricane"],
        4: ["heavy", "strong", "high", "dangerous", "submerged", "flood"],
        3: ["moderate", "medium", "steady", "waterlogging"],
        2: ["light", "low", "minor", "drizzle"],
        1: ["slight", "trace", "minimal"]
    }

    @classmethod
    def classify(cls, content: str) -> Dict[str, Any]:
        """
        Classifies the text content into an event type and severity.
        """
        content_lower = content.lower()
        
        assigned_type = "OTHER"
        # Find the first matching event type based on keywords
        for event_type, keywords in cls.KEYWORD_MAP.items():
            if any(kw in content_lower for kw in keywords):
                assigned_type = event_type
                break

        # Determine severity
        assigned_severity = 3 # Default moderate
        found_severity = False
        for sev_level in [5, 4, 3, 2, 1]:
            if any(kw in content_lower for kw in cls.SEVERITY_KEYWORDS[sev_level]):
                assigned_severity = sev_level
                found_severity = True
                break
                
        # If no explicit severity keyword but event is extreme by nature
        if not found_severity:
            if assigned_type in ["CYCLONE", "LANDSLIDE"]:
                assigned_severity = 5
            elif assigned_type in ["FLOOD", "HEATWAVE"]:
                assigned_severity = 4

        return {
            "event_type": assigned_type,
            "severity": assigned_severity
        }
