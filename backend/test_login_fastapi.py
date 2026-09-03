from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

response = client.post(
    "/api/v1/auth/login",
    data={"username": "admin", "password": "password"}
)
print("STATUS CODE:", response.status_code)
print("JSON:", response.json())
