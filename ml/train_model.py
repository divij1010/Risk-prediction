# ml/train_model.py
# ------------------------------------
# ASRIPS - Student Risk Prediction Model
# ------------------------------------

import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report

# Load dataset
data = pd.read_csv("data/student_data.csv")

# Feature Engineering
data["attendance_trend"] = data["attendance_current"] - data["attendance_prev"]
data["engagement_score"] = data["lms_logins"] / data["total_days"]

features = [
    "attendance_trend",
    "assignment_delay_avg",
    "marks_std",
    "engagement_score"
]

target = "risk_level"

X = data[features]
y = data[target]

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# ML Pipeline
model = Pipeline([
    ("scaler", StandardScaler()),
    ("rf", RandomForestClassifier(
        n_estimators=200,
        random_state=42
    ))
])

# Train model
model.fit(X_train, y_train)

# Evaluate
predictions = model.predict(X_test)
print("MODEL EVALUATION REPORT")
print(classification_report(y_test, predictions))

# Save model
joblib.dump(model, "ml/risk_model.pkl")
print("Model saved as ml/risk_model.pkl")
