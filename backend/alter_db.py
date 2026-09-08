import sqlite3

def add_columns():
    conn = sqlite3.connect("weather_truth.db")
    cursor = conn.cursor()
    columns_to_add = [
        "ALTER TABLE observations ADD COLUMN ml_event_type VARCHAR",
        "ALTER TABLE observations ADD COLUMN verification_recommendation VARCHAR",
        "ALTER TABLE observations ADD COLUMN model_version VARCHAR",
        "ALTER TABLE observations ADD COLUMN ml_processed_at DATETIME",
        "ALTER TABLE observations ADD COLUMN image_hash VARCHAR",
        "ALTER TABLE observations ADD COLUMN image_analyzed_state VARCHAR DEFAULT 'NOT_ANALYZED'",
    ]
    
    table_to_add = """
    CREATE TABLE IF NOT EXISTS translated_alerts (
        id VARCHAR PRIMARY KEY,
        alert_id VARCHAR NOT NULL,
        language VARCHAR NOT NULL,
        translated_text VARCHAR NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (alert_id) REFERENCES alerts(alert_id)
    )
    """
    
    for cmd in columns_to_add:
        try:
            cursor.execute(cmd)
            print(f"Executed: {cmd}")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print(f"Skipped (already exists): {cmd}")
            else:
                print(f"Error: {e}")
                
    try:
        cursor.execute(table_to_add)
        print("Executed: CREATE TABLE translated_alerts")
    except sqlite3.OperationalError as e:
        print(f"Error creating table: {e}")
                
    conn.commit()
    conn.close()

if __name__ == "__main__":
    add_columns()
