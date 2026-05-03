import json
import numpy as np
import joblib
import sys
import os


def explain_anomaly(features, explain=True):
    script_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(script_dir, 'keystroke_anomaly_model.pkl')

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model not found at {model_path}")

    model = joblib.load(model_path)

    feature_order = [
        'avgHoldTime', 'cvHoldTime',
        'avgFlightTime', 'cvFlightTime',
        'wpm', 'pauseFrequency', 'pauseDuration', 'backspaceRate'
    ]

    meta_path = os.path.join(script_dir, 'model_features.json')
    if os.path.exists(meta_path):
        with open(meta_path, encoding='utf-8') as mf:
            feature_order = json.load(mf).get('features', feature_order)

    X = np.array([[float(features[f]) for f in feature_order]])

    prediction = model.predict(X)[0]
    score = model.score_samples(X)[0]

    named_shap = []
    if explain:
        try:
            import shap
            explainer = shap.TreeExplainer(model)
            shap_values = explainer.shap_values(X)
            shap_list = shap_values[0].tolist()

            for i, feat in enumerate(feature_order):
                val = float(shap_list[i])
                named_shap.append({
                    'feature': feat,
                    'shapValue': val,
                    'featureValue': float(X[0][i]),
                    'direction': 'increases_anomaly' if val > 0 else 'decreases_anomaly',
                    'impact': (
                        'HIGH' if abs(val) > 0.15 else
                        'MEDIUM' if abs(val) > 0.05 else
                        'LOW'
                    )
                })

            named_shap.sort(key=lambda x: abs(x['shapValue']), reverse=True)
        except Exception as shap_err:
            named_shap = []
            print(f"SHAP warning: {shap_err}", file=sys.stderr)

    return {
        'anomalyScore': float(score),
        'isAnomalous': bool(prediction == -1),
        'shapValues': named_shap
    }


if __name__ == '__main__':
    raw = sys.stdin.read()
    payload = json.loads(raw)

    if isinstance(payload, dict) and isinstance(payload.get('features'), dict):
        features = payload['features']
        explain = bool(payload.get('explain', True))
    else:
        features = payload
        explain = True

    result = explain_anomaly(features, explain=explain)
    print(json.dumps(result))