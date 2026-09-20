import sys
import os

backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from app.core.database import SessionLocal
from app.intelligence.clustering_engine import ClusteringEngine

def test_recluster():
    db = SessionLocal()
    active = ClusteringEngine.recluster_all_active(db)
    print("Reclustered active events:", active)
    db.close()

if __name__ == "__main__":
    test_recluster()
