import csv
import os
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_FILE = os.path.join(BASE_DIR, "prediction_logs.csv")
HISTORY_FILE = os.path.join(BASE_DIR, "student_history.csv")

def log_prediction(data, result):
    file_exists = os.path.isfile(LOG_FILE)

    with open(LOG_FILE, mode="a", newline="") as file:
        writer = csv.writer(file)

        if not file_exists:
            writer.writerow([
                "timestamp",
                "attendance_trend",
                "assignment_delay_avg",
                "marks_std",
                "engagement_score",
                "risk_level",
                "confidence"
            ])

        writer.writerow([
            datetime.now(),
            data["attendance_trend"],
            data["assignment_delay_avg"],
            data["marks_std"],
            data["engagement_score"],
            result["risk_level"],
            result["confidence"]
        ])
        
def log_student_history(student_id, features, result):
    file_exists = os.path.isfile(HISTORY_FILE)

    with open(HISTORY_FILE, mode='a', newline='') as file:
        writer = csv.writer(file)

        if not file_exists:
            writer.writerow([
                "timestamp",
                "student_id",
                "attendance_trend",
                "assignment_delay_avg",
                "marks_std",
                "engagement_score",
                "risk_level"
            ])

        writer.writerow([
            datetime.now(),
            student_id,
            features["attendance_trend"],
            features["assignment_delay_avg"],
            features["marks_std"],
            features["engagement_score"],
            result["risk_level"]
        ])


def log_alert(student_id, message, method="manual", status="queued"):
    alerts_file = os.path.join(BASE_DIR, "alerts.csv")
    file_exists = os.path.isfile(alerts_file)
    with open(alerts_file, mode='a', newline='') as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(["timestamp", "student_id", "message", "method", "status"])
        writer.writerow([datetime.now(), student_id, message, method, status])

