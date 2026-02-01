# backend/model_loader.py
import joblib
import json
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE, 'ml', 'risk_model.pkl')
MODEL_META = os.path.join(BASE, 'ml', 'model_meta.json')

model = joblib.load(MODEL_PATH)
model_features = []
if os.path.exists(MODEL_META):
    try:
        with open(MODEL_META, 'r') as f:
            meta = json.load(f)
            model_features = meta.get('features', [])
    except Exception:
        model_features = []
else:
    # Best-effort: try to infer feature count from scaler / model if available
    model_features = []  # keep empty as fallback
