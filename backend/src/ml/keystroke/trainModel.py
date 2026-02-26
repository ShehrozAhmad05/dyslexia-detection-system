import json
import numpy as np
from sklearn.ensemble import IsolationForest
import joblib
import os

def train_isolation_forest():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(script_dir, 'training_data.json')
    model_path = os.path.join(script_dir, 'keystroke_anomaly_model.pkl')

    if not os.path.exists(data_path):
        raise FileNotFoundError(f"training_data.json not found at {data_path}. Run preprocessData.js first.")

    with open(data_path, 'r') as f:
        data = json.load(f)

    if not data:
        raise ValueError('No training data found. Check preprocessing output.')

    X = np.array([
        [
            s['avgHoldTime'],
            s['stdHoldTime'],
            s['cvHoldTime'],
            s['avgFlightTime'],
            s['stdFlightTime'],
            s['cvFlightTime']
        ]
        for s in data
    ])

    print(f"📊 Loaded {len(X)} sessions; feature matrix shape: {X.shape}")

    model = IsolationForest(
        n_estimators=150,
        contamination=0.1,
        random_state=42,
    )

    print('🤖 Training Isolation Forest...')
    model.fit(X)
    print('✅ Training complete')

    joblib.dump(model, model_path)
    print(f'💾 Model saved to: {model_path}')

    preds = model.predict(X)
    anomalies = np.sum(preds == -1)
    print(f'📈 Anomaly rate on training data: {anomalies/len(X)*100:.1f}%')

if __name__ == '__main__':
    train_isolation_forest()
