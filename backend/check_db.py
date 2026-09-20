import sqlite3
import json
conn = sqlite3.connect('a:/SkyFusionX/backend/weather_truth.db')
conn.row_factory = sqlite3.Row
c = conn.cursor()
c.execute("SELECT id, media_url, trust_score, ml_confidence, gemini_evidence_json, gemini_analyzed, image_analyzed FROM observations WHERE media_url IS NOT NULL AND media_url != '' LIMIT 2")
rows = c.fetchall()
for r in rows:
    print(dict(r))
