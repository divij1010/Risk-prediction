# backend/schemas.py
from pydantic import BaseModel
from typing import List

class StudentInput(BaseModel):
    attendance_current: float
    attendance_prev: float
    assignment_delay_avg: float
    marks_std: float
    lms_logins: int
    total_days: int
    student_id: str


class PredictionResponse(BaseModel):
    risk_level: str
    confidence: float
    recommended_action: str
    reasons: List[str]