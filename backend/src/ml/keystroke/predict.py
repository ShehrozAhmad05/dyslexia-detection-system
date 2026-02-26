import json
import numpy as np
import joblib
import sys
import os

def predict_anomaly(features):
    script_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(script_dir, 'keystroke_anomaly_model.pkl')

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found at {model_path}. Train the model first.")

    model = joblib.load(model_path)

    X = np.array([[
        features['avgHoldTime'],
        features['stdHoldTime'],
        features['cvHoldTime'],
        features['avgFlightTime'],
        features['stdFlightTime'],
        features['cvFlightTime']
    ]])

    prediction = model.predict(X)[0]  # 1 = normal, -1 = anomaly
    score = model.score_samples(X)[0]  # lower = more anomalous

    return {
        'anomalyScore': float(score),
        'isAnomalous': bool(prediction == -1)
    }

if __name__ == '__main__':
    raw = sys.stdin.read()
    features = json.loads(raw)
    result = predict_anomaly(features)
    print(json.dumps(result))
