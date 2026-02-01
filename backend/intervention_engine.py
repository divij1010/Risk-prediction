# backend/intervention_engine.py

def recommend_intervention(risk_level, features):
    if risk_level == "High" and features["attendance_trend"] < 0:
        return "Immediate counseling and strict attendance monitoring"

    if risk_level == "High" and features["assignment_delay_avg"] > 4:
        return "Academic mentoring and assignment deadline tracking"

    if risk_level == "Medium":
        return "Time management and study skills workshop"

    return "Continue current academic plan"
