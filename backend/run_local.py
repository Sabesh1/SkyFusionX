import uvicorn
import os
import sys

if __name__ == "__main__":
    # Ensure current backend directory is in python path
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)

    print("=" * 60)
    print("  AI Weather Truth Engine — FastAPI Backend Server")
    print("  Listening on http://localhost:8000")
    print("  Interactive Docs at http://localhost:8000/docs")
    print("=" * 60)

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
