"""Phase D.3: Test handwriting API endpoints over HTTP."""

from __future__ import annotations

import json
from pathlib import Path

import requests


BASE_URL = "http://localhost:8000"
REQUIRED_FIELDS = {
    "expected_sentence",
    "detected_sentence",
    "total_words",
    "word_results",
    "reversal_count",
    "overall_score",
    "risk_level",
    "disclaimer",
}


def main() -> None:
    """Run sentence and analyze endpoint checks against running server."""
    project_root = Path(__file__).resolve().parents[2]
    reversal_image_path = project_root / "ml-models" / "scripts" / "test_reversal_sample.png"

    try:
        sentence_response = requests.get(
            f"{BASE_URL}/api/ml/handwriting/sentence",
            timeout=20,
        )
    except requests.RequestException as exc:
        print(f"Sentence endpoint request failed: {exc}")
        print("ENDPOINT TEST: FAIL")
        return

    sentence_payload = sentence_response.json()
    print(f"Sentence endpoint status: {sentence_response.status_code}")
    print("Sentence endpoint response:")
    print(json.dumps(sentence_payload, indent=2))

    try:
        with reversal_image_path.open("rb") as image_file:
            analyze_response = requests.post(
                f"{BASE_URL}/api/ml/handwriting/analyze",
                files={"file": (reversal_image_path.name, image_file, "image/png")},
                data={"expected_sentence": "the big dog can jump"},
                timeout=20,
            )
    except requests.RequestException as exc:
        print(f"Analyze endpoint request failed: {exc}")
        print("ENDPOINT TEST: FAIL")
        return

    try:
        analysis_payload = analyze_response.json()
    except ValueError:
        analysis_payload = {"raw_response": analyze_response.text}

    print(f"Analyze endpoint status: {analyze_response.status_code}")
    print("Analyze endpoint response:")
    print(json.dumps(analysis_payload, indent=2))

    if analyze_response.status_code != 200 or sentence_response.status_code != 200:
        print("ENDPOINT TEST: FAIL")
        return

    missing = [field for field in REQUIRED_FIELDS if field not in analysis_payload]
    if missing:
        print(f"Missing fields: {missing}")
        print("ENDPOINT TEST: FAIL")
    else:
        print("ENDPOINT TEST: PASS")


if __name__ == "__main__":
    main()
