from fastapi import FastAPI
from backend.explain import explain_risk
from backend.logger import log_student_history
from backend.logger import log_prediction
from fastapi.middleware.cors import CORSMiddleware
from backend.schemas import StudentInput, PredictionResponse
from backend.model_loader import model
from backend.intervention_engine import recommend_intervention
import pandas as pd
from backend.logger import HISTORY_FILE, LOG_FILE

app = FastAPI(title="ASRIPS - Adaptive Student Risk Prediction System")

# Log model meta on startup to help troubleshoot feature mismatches
@app.on_event("startup")
def log_model_info():
    try:
        from backend.model_loader import model_features
        print("MODEL: loaded model metadata features:", model_features)
    except Exception as e:
        print("MODEL: unable to read model metadata features", e)

# For local development allow all origins to avoid CORS headaches (change for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # DEV ONLY: use explicit origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper to map model prediction (numeric or string) to a canonical string label
# Supports: numeric labels (0=Low,1=Medium,2=High) or string labels ('Low','Medium','High')
def map_risk_to_string(risk):
    # If the model already returned a string label, normalize and validate it
    if isinstance(risk, str):
        normalized = risk.capitalize()
        if normalized in ("Low", "Medium", "High"):
            return normalized
        return "Unknown"

    # Otherwise try to convert numeric-like outputs to int and map
    try:
        risk_int = int(risk)
    except Exception:
        return "Unknown"

    return {0: "Low", 1: "Medium", 2: "High"}.get(risk_int, "Unknown")

from fastapi.responses import JSONResponse
import traceback


@app.post("/predict", response_model=PredictionResponse)
def predict_student_risk(student: StudentInput):
    try:
        attendance_trend = student.attendance_current - student.attendance_prev
        if student.total_days > 0:
            engagement_score = student.lms_logins / student.total_days
        else:
            engagement_score = 0

        # Build feature vector according to model metadata (if available)
        try:
            from backend.model_loader import model_features
        except Exception:
            model_features = []

        # Precompute derived values
        attendance_change_pct = 0.0
        try:
            if student.attendance_prev:
                attendance_change_pct = ((student.attendance_current - student.attendance_prev) / student.attendance_prev) * 100.0
        except Exception:
            attendance_change_pct = 0.0
        attendance_drop_flag = 1 if attendance_change_pct < -5 else 0
        avg_marks = getattr(student, 'avg_marks', 0) or 0
        lms_per_day = (student.lms_logins / student.total_days) if student.total_days and student.total_days > 0 else 0.0

        # If we don't have model_features metadata, fall back to default small set
        if not model_features:
            feature_order = ['attendance_trend', 'assignment_delay_avg', 'marks_std', 'engagement_score']
        else:
            feature_order = model_features

        X_row = []
        for feat in feature_order:
            if feat == 'attendance_trend':
                X_row.append(attendance_trend)
            elif feat == 'attendance_change_pct':
                X_row.append(attendance_change_pct)
            elif feat == 'attendance_drop_flag':
                X_row.append(attendance_drop_flag)
            elif feat == 'assignment_delay_avg':
                X_row.append(student.assignment_delay_avg)
            elif feat == 'marks_std':
                X_row.append(student.marks_std)
            elif feat == 'avg_marks':
                X_row.append(avg_marks)
            elif feat == 'engagement_score':
                X_row.append(lms_per_day)
            elif feat == 'lms_logins_per_day':
                X_row.append(lms_per_day)
            else:
                # unknown feature expected by model; default to 0
                X_row.append(0.0)

        X = [X_row]

        # model operations may raise; handle and return informative JSON on error
        try:
            raw_pred = model.predict(X)[0]
            proba = model.predict_proba(X)[0] if hasattr(model, 'predict_proba') else None
            confidence = max(proba) if proba is not None else 0.0
        except Exception as me:
            tb = traceback.format_exc()
            print("Model prediction error:\n", tb)
            return JSONResponse(status_code=500, content={"error": "Model prediction failed", "details": str(me), "feature_order": feature_order, "X": X})

        # Normalize prediction into canonical string label (Low/Medium/High/Unknown)
        risk_level = map_risk_to_string(raw_pred)

        intervention = recommend_intervention(
            risk_level,  # pass string label expected by engine
            {
                "attendance_trend": attendance_trend,
                "assignment_delay_avg": student.assignment_delay_avg
            }
        )
        reasons = explain_risk(
            attendance_trend,
            student.assignment_delay_avg,
            student.marks_std,
            engagement_score
        )

        # ✅ Create result first
        result = {
            "student_id": student.student_id,
            "risk_level": risk_level,  # Now string
            "confidence": round(confidence, 2),
            "recommended_action": intervention,
            "reasons": reasons
        }

        # ✅ Log to CSV (assume loggers handle string risk_level)
        log_prediction(
            {
                "attendance_trend": attendance_trend,
                "assignment_delay_avg": student.assignment_delay_avg,
                "marks_std": student.marks_std,
                "engagement_score": engagement_score
            },
            result
        )
        log_student_history(
            student.student_id,
            {
                "attendance_trend": attendance_trend,
                "assignment_delay_avg": student.assignment_delay_avg,
                "marks_std": student.marks_std,
                "engagement_score": engagement_score
            },
            result
        )

        # ✅ Then return
        return result
    except Exception as e:
        tb = traceback.format_exc()
        print("Unhandled error in /predict:\n", tb)
        return JSONResponse(status_code=500, content={"error": "Unexpected server error", "details": str(e)})

@app.get("/student-history/{student_id}")
def get_student_history(student_id: str):
    try:
        df = pd.read_csv(HISTORY_FILE, dtype={"student_id": str})
        df["student_id"] = df["student_id"].astype(str)
        student_data = df[df["student_id"] == str(student_id)]

        if student_data.empty:
            return {"timestamps": [], "risks": []}  # Graceful empty response

        return {
            "timestamps": student_data["timestamp"].tolist(),
            "risks": student_data["risk_level"].tolist()  # Assuming strings from log
        }
    except FileNotFoundError:
        return {"timestamps": [], "risks": []}  # If no file yet
    except Exception as e:
        return {"error": str(e)}


@app.get("/cohort-stats")
def cohort_stats():
    try:
        df = pd.read_csv(HISTORY_FILE, dtype={"student_id": str})
        df["student_id"] = df["student_id"].astype(str)

        if df.empty:
            return {"cohorts": []}

        # Derive a simple cohort key from student_id prefix (first 2 chars)
        df["cohort"] = df["student_id"].str[:2].fillna("NA")

        cohorts = []
        for name, group in df.groupby("cohort"):
            counts = group["risk_level"].value_counts().to_dict()
            counts_struct = {
                "Low": int(counts.get("Low", 0)),
                "Medium": int(counts.get("Medium", 0)),
                "High": int(counts.get("High", 0)),
                "Unknown": int(counts.get("Unknown", 0))
            }

            # Top students with most High counts
            high_counts = group.groupby("student_id").apply(lambda g: int((g["risk_level"] == "High").sum())).sort_values(ascending=False).head(5)
            top_students = [{"student_id": sid, "high_count": int(cnt)} for sid, cnt in high_counts.items()]

            cohorts.append({"cohort": str(name), "counts": counts_struct, "top_students": top_students})

        return {"cohorts": cohorts}
    except FileNotFoundError:
        return {"cohorts": []}
    except Exception as e:
        return {"error": str(e)}


@app.get("/teacher-summary")
def teacher_summary():
    try:
        df = pd.read_csv(HISTORY_FILE, dtype={"student_id": str})
        if df.empty:
            return {"total_students": 0, "counts": {"Low": 0, "Medium": 0, "High": 0}, "avg_confidence": 0.0}

        total_students = int(df["student_id"].nunique())
        counts = df["risk_level"].value_counts().to_dict()
        counts_struct = {
            "Low": int(counts.get("Low", 0)),
            "Medium": int(counts.get("Medium", 0)),
            "High": int(counts.get("High", 0)),
            "Unknown": int(counts.get("Unknown", 0))
        }

        high_counts = df.groupby("student_id").apply(lambda g: int((g["risk_level"] == "High").sum())).sort_values(ascending=False).head(10)
        top_high = [{"student_id": sid, "high_count": int(cnt)} for sid, cnt in high_counts.items()]

        # Compute average confidence using prediction logs (trusted source for confidence)
        avg_confidence = 0.0
        try:
            log_df = pd.read_csv(LOG_FILE)
            if "confidence" in log_df.columns and not log_df.empty:
                avg_confidence = float(log_df["confidence"].mean())
        except FileNotFoundError:
            avg_confidence = 0.0
        except Exception:
            # If anything unexpected happens reading the logs, keep 0.0 to avoid breaking the API
            avg_confidence = 0.0

        return {"total_students": total_students, "counts": counts_struct, "top_high_students": top_high, "avg_confidence": avg_confidence}
    except FileNotFoundError:
        return {"total_students": 0, "counts": {"Low": 0, "Medium": 0, "High": 0}, "avg_confidence": 0.0}
    except Exception as e:
        return {"error": str(e)}


# --- Additional endpoints: export CSVs and send alerts ---
from fastapi import Response
from backend.logger import log_alert
from pydantic import BaseModel

@app.get("/cohort-export")
def cohort_export(cohort: str = None):
    try:
        df = pd.read_csv(HISTORY_FILE, dtype={"student_id": str})
        if df.empty:
            return Response(status_code=204)

        if cohort:
            df = df[df["student_id"].str.startswith(str(cohort))]

        csv_data = df.to_csv(index=False)
        return Response(content=csv_data, media_type="text/csv")
    except FileNotFoundError:
        return Response(status_code=204)
    except Exception as e:
        return {"error": str(e)}


@app.get("/student-report/{student_id}")
def student_report(student_id: str):
    try:
        df = pd.read_csv(HISTORY_FILE, dtype={"student_id": str})
        df = df[df["student_id"] == str(student_id)]
        if df.empty:
            return Response(status_code=204)
        csv_data = df.to_csv(index=False)
        return Response(content=csv_data, media_type="text/csv")
    except FileNotFoundError:
        return Response(status_code=204)
    except Exception as e:
        return {"error": str(e)}


class AlertRequest(BaseModel):
    student_id: str
    message: str
    method: str = "manual"

@app.post("/send-alert")
def send_alert(req: AlertRequest):
    try:
        # Simple implementation: log the alert and return success
        log_alert(req.student_id, req.message, method=req.method, status="sent")
        return {"status": "ok", "student_id": req.student_id}
    except Exception as e:
        return {"error": str(e)}