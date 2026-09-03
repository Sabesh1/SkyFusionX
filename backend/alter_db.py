import sqlite3

def add_columns():
    conn = sqlite3.connect("weather_truth.db")
    cursor = conn.cursor()
    columns_to_add = [
        "ALTER TABLE observations ADD COLUMN ml_event_type VARCHAR",
        "ALTER TABLE observations ADD COLUMN verification_recommendation VARCHAR",
        "ALTER TABLE observations ADD COLUMN model_version VARCHAR",
        "ALTER TABLE observations ADD COLUMN ml_processed_at DATETIME",
    ]
    
    for cmd in columns_to_add:
        try:
            cursor.execute(cmd)
            print(f"Executed: {cmd}")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print(f"Skipped (already exists): {cmd}")
            else:
                print(f"Error: {e}")
                
    conn.commit()
    conn.close()

if __name__ == "__main__":
    add_columns()
