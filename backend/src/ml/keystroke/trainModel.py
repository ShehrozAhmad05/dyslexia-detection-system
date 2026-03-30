import json
import numpy as np
from sklearn.ensemble import IsolationForest
import joblib
import os

# ============================================================
# 8 NORMALIZED FEATURES (Aalto 136M Keystrokes Dataset)
# Removed: stdHoldTime, stdFlightTime (redundant — CV encodes std/mean)
# Removed: errorRate (identical to backspaceRate)
# Added:   wpm, pauseFrequency, pauseDuration, backspaceRate
# ============================================================
FEATURES = [
    'avgHoldTime',    # mean key-press duration (ms)
    'cvHoldTime',     # hold-time variability (%) — rhythm consistency
    'avgFlightTime',  # mean inter-key interval (ms) — typing tempo
    'cvFlightTime',   # flight-time variability (%) — timing variability
    'wpm',            # typing speed (words per minute)
    'pauseFrequency', # hesitation pauses per word (sentence-length neutral)
    'pauseDuration',  # average pause length (ms) — cognitive load
    'backspaceRate',  # BKSP+DEL / total keystrokes — spelling corrections
]


def train_isolation_forest():
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Prefer Aalto-derived data; fall back to legacy file
    data_path = os.path.join(script_dir, 'training_data_aalto.json')
    if not os.path.exists(data_path):
        data_path = os.path.join(script_dir, 'training_data.json')
        print(f'[WARN] Aalto data not found; using legacy: {data_path}')

    model_path = os.path.join(script_dir, 'keystroke_anomaly_model.pkl')

    if not os.path.exists(data_path):
        raise FileNotFoundError(
            f'Training data not found at {data_path}.\n'
            'Run: python backend/scripts/process_aalto_dataset.py first.'
        )

    with open(data_path, 'r') as f:
        data = json.load(f)

    if not data:
        raise ValueError('No training data found. Check preprocessing output.')

    # Build feature matrix — skip sessions missing any feature
    rows = []
    skipped = 0
    for s in data:
        try:
            rows.append([float(s[feat]) for feat in FEATURES])
        except (KeyError, TypeError, ValueError):
            skipped += 1

    if skipped:
        print(f'[WARN] Skipped {skipped} sessions with missing features.')

    X = np.array(rows)
    print(f'Loaded {len(X)} sessions  |  feature matrix: {X.shape}  |  features: {FEATURES}')

    model = IsolationForest(
        n_estimators=150,
        contamination=0.04,  # mostly-normal training data; keep anomaly prior conservative
        random_state=42,
        n_jobs=-1,
    )

    print('Training Isolation Forest...')
    model.fit(X)
    print('Training complete')

    joblib.dump(model, model_path)
    print(f'Model saved: {model_path}')

    preds = model.predict(X)
    scores = model.score_samples(X)
    anomalies = np.sum(preds == -1)
    print(f'Anomaly rate on training data: {anomalies / len(X) * 100:.1f}%  (target ~10%)')

    # Percentile-based calibration for downstream ML score normalization.
    # Lower IsolationForest score = more anomalous.
    score_p5 = float(np.percentile(scores, 5))
    score_p95 = float(np.percentile(scores, 95))
    print(f'ML score calibration: p5={score_p5:.6f}, p95={score_p95:.6f}')

    # Save feature order alongside model so predict.py stays in sync
    meta_path = os.path.join(script_dir, 'model_features.json')
    with open(meta_path, 'w') as f:
        json.dump({
            'features': FEATURES,
            'mlScoreCalibration': {
                'minScore': score_p5,
                'maxScore': score_p95,
                'method': 'percentile',
                'source': 'trainModel.py score_samples on training set',
            }
        }, f, indent=2)
    print(f'Feature order saved: {meta_path}')


if __name__ == '__main__':
    train_isolation_forest()
