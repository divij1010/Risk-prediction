from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)
payload = {
    "student_id": "0112",
    "attendance_current": 78,
    "attendance_prev": 85,
    "assignment_delay_avg": 4,
    "marks_std": 12,
    "lms_logins": 40,
    "total_days": 120
}
resp = client.post('/predict', json=payload)
print('STATUS', resp.status_code)
print('TEXT', resp.text)
try:
    print('JSON', resp.json())
except Exception as e:
    print('No JSON:', e)
