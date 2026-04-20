"""
Compare YOLO v1 and v2 reversal detectors on synthetic words validation split.

Run from project root:
    python ml-models/scripts/compare_yolo_models.py
"""

from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Any

import yaml
from ultralytics import YOLO


def load_yaml(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as file:
        data = yaml.safe_load(file)
    if not isinstance(data, dict):
        raise ValueError(f"Invalid YAML structure in {path}")
    return data


def parse_class_names(names_field: Any) -> dict[int, str]:
    if isinstance(names_field, dict):
        parsed: dict[int, str] = {}
        for key, value in names_field.items():
            parsed[int(key)] = str(value)
        return dict(sorted(parsed.items(), key=lambda item: item[0]))

    if isinstance(names_field, list):
        return {index: str(name) for index, name in enumerate(names_field)}

    raise ValueError("Invalid `names` format in data.yaml")


def evaluate_model(model_path: Path, data_yaml_path: Path) -> dict[str, Any]:
    model = YOLO(str(model_path))
    metrics = model.val(data=str(data_yaml_path), split="val", verbose=False)

    data_config = load_yaml(data_yaml_path)
    class_names = parse_class_names(data_config.get("names"))
    per_class_map50: dict[str, float] = {}
    for class_id, class_name in class_names.items():
        _, _, ap50, _ = metrics.box.class_result(class_id)
        per_class_map50[class_name] = float(ap50)

    return {
        "map50": float(metrics.box.map50),
        "map": float(metrics.box.map),
        "precision": float(metrics.box.mp),
        "recall": float(metrics.box.mr),
        "per_class_map50": per_class_map50,
    }


def pick_better(v1_value: float, v2_value: float) -> str:
    if v2_value > v1_value:
        return "V2"
    if v1_value > v2_value:
        return "V1"
    return "Tie"


def format_row(label: str, v1_value: float, v2_value: float) -> str:
    return f"{label:<15} {v1_value:>13.6f}   {v2_value:>14.6f}"


def main() -> int:
    project_root = Path(__file__).resolve().parents[2]

    v1_path = (
        project_root / "ml-models" / "handwriting" / "models" / "reversal_yolo_v1.pt"
    )
    v2_path = (
        project_root / "ml-models" / "handwriting" / "models" / "reversal_yolo_v2.pt"
    )
    data_yaml_path = (
        project_root
        / "data"
        / "processed"
        / "handwriting"
        / "synthetic_words"
        / "data.yaml"
    )

    if not v1_path.exists():
        print(f"ERROR: V1 model file not found: {v1_path}")
        return 1
    if not v2_path.exists():
        print(f"ERROR: V2 model file not found: {v2_path}")
        return 1
    if not data_yaml_path.exists():
        print(f"ERROR: Dataset config not found: {data_yaml_path}")
        return 1

    v1_metrics = evaluate_model(v1_path, data_yaml_path)
    v2_metrics = evaluate_model(v2_path, data_yaml_path)

    better_overall = pick_better(v1_metrics["map50"], v2_metrics["map50"])
    better_reversal = pick_better(
        v1_metrics["per_class_map50"]["Reversal"],
        v2_metrics["per_class_map50"]["Reversal"],
    )

    lines = [
        "============================================",
        "MODEL COMPARISON: V1 vs V2",
        "============================================",
        "Metric          V1 (Synthetic)   V2 (Real+Words)",
        "--------------------------------------------",
        format_row("mAP@50", v1_metrics["map50"], v2_metrics["map50"]),
        format_row("mAP@50-95", v1_metrics["map"], v2_metrics["map"]),
        format_row("Precision", v1_metrics["precision"], v2_metrics["precision"]),
        format_row("Recall", v1_metrics["recall"], v2_metrics["recall"]),
        "--------------------------------------------",
        "Per-class mAP@50:",
        format_row(
            "  Normal",
            v1_metrics["per_class_map50"]["Normal"],
            v2_metrics["per_class_map50"]["Normal"],
        ),
        format_row(
            "  Reversal",
            v1_metrics["per_class_map50"]["Reversal"],
            v2_metrics["per_class_map50"]["Reversal"],
        ),
        format_row(
            "  Corrected",
            v1_metrics["per_class_map50"]["Corrected"],
            v2_metrics["per_class_map50"]["Corrected"],
        ),
        "============================================",
        "Training data:",
        "  V1: Synthdata 2,739 images (synthetic isolated letters)",
        "  V2: Kaggle real letters assembled into 15,000 synthetic words",
        "============================================",
        "Conclusion:",
        f"  Better overall mAP@50: {better_overall}",
        f"  Better Reversal detection: {better_reversal}",
        "  Recommended for production: V2",
        "  Reason: V2 trained on real handwriting data in word context,",
        "          reducing domain shift for real user inputs.",
        "============================================",
    ]

    comparison_text = "\n".join(lines)
    print(comparison_text)

    output_path = (
        project_root
        / "ml-models"
        / "handwriting"
        / "training"
        / "reversal_yolo_comparison.txt"
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)
    file_lines = lines + [
        f"Date and time of comparison: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "V1 path: ml-models/handwriting/models/reversal_yolo_v1.pt",
        "V2 path: ml-models/handwriting/models/reversal_yolo_v2.pt",
    ]
    output_path.write_text("\n".join(file_lines) + "\n", encoding="utf-8")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
