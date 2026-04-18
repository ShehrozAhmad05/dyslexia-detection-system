"""
Evaluate trained YOLO reversal detector on validation split.

Run from project root:
    python ml-models/scripts/evaluate_reversal_yolo.py
"""

from __future__ import annotations

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


def main() -> int:
    project_root = Path(__file__).resolve().parents[2]
    ml_models_root = project_root / "ml-models"

    config_path = ml_models_root / "handwriting" / "training" / "reversal_yolo_train.yaml"
    config = load_yaml(config_path)

    best_weights = ml_models_root / "logs" / "yolo_reversal" / "reversal_detector" / "weights" / "best.pt"
    if not best_weights.exists():
        print(f"ERROR: Trained weights not found: {best_weights}")
        print("Run training first: python ml-models/scripts/train_reversal_yolo.py")
        return 1

    data_yaml_path = Path(str(config["data"]))
    data_config = load_yaml(data_yaml_path)
    class_names = parse_class_names(data_config.get("names"))

    model = YOLO(str(best_weights))
    val_kwargs = {
        "data": str(data_yaml_path),
        "split": "val",
        "device": config.get("device"),
        "imgsz": config.get("imgsz"),
        "batch": config.get("batch"),
        "workers": config.get("workers"),
        "verbose": False,
    }
    val_kwargs = {key: value for key, value in val_kwargs.items() if value is not None}
    metrics = model.val(**val_kwargs)

    print("=== YOLO Reversal Evaluation ===")
    print(f"Weights: {best_weights}")
    print(f"Dataset: {data_yaml_path}")
    print()
    print(f"mAP@50: {float(metrics.box.map50):.6f}")
    print(f"mAP@50-95: {float(metrics.box.map):.6f}")
    print(f"Precision: {float(metrics.box.mp):.6f}")
    print(f"Recall: {float(metrics.box.mr):.6f}")
    print()
    print("Per-class results:")

    for class_id, class_name in class_names.items():
        precision, recall, ap50, ap = metrics.box.class_result(class_id)
        print(
            f"- {class_name}: "
            f"Precision={float(precision):.6f}, "
            f"Recall={float(recall):.6f}, "
            f"mAP@50={float(ap50):.6f}, "
            f"mAP@50-95={float(ap):.6f}"
        )

    if float(metrics.box.map50) >= 0.80:
        print("\n✅ Model meets FYP target (>80% mAP@50)")
    else:
        print("\n⚠️ Model below FYP target. Consider more epochs or data.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
