# Topics used in the pipeline
TOPIC_RAW = "weather.raw"
TOPIC_CLEANED = "weather.cleaned"
TOPIC_VERIFIED = "weather.verified"
TOPIC_CLASSIFIED = "weather.classified"
TOPIC_FUSED = "weather.fused"
TOPIC_CLUSTERED = "weather.clustered"
TOPIC_PREDICTED = "weather.predicted"
TOPIC_RISK = "weather.risk"
TOPIC_ALERTS = "weather.alerts"
TOPIC_DLQ = "weather.dlq"

ALL_TOPICS = [
    TOPIC_RAW, TOPIC_CLEANED, TOPIC_VERIFIED, TOPIC_CLASSIFIED, 
    TOPIC_FUSED, TOPIC_CLUSTERED, TOPIC_PREDICTED, TOPIC_RISK, 
    TOPIC_ALERTS, TOPIC_DLQ
]
