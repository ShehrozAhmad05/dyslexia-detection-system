"""
Evaluate YOLO v2 reversal detector on synthetic words validation split.

Run from project root:
    python ml-models/scripts/evaluate_reversal_yolo_v2.py
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

    model_path = (
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

    if not model_path.exists():
        print(f"ERROR: Model file not found: {model_path}")
        return 1
    if not data_yaml_path.exists():
        print(f"ERROR: Dataset config not found: {data_yaml_path}")
        return 1

    data_config = load_yaml(data_yaml_path)
    class_names = parse_class_names(data_config.get("names"))

    model = YOLO(str(model_path))
    metrics = model.val(data=str(data_yaml_path), split="val", verbose=False)

    print("================================")
    print("V2 MODEL — IN-DISTRIBUTION EVAL")
    print("(synthetic words val split)")
    print("================================")
    print(f"mAP@50:      {float(metrics.box.map50):.6f}")
    print(f"mAP@50-95:   {float(metrics.box.map):.6f}")
    print(f"Precision:   {float(metrics.box.mp):.6f}")
    print(f"Recall:      {float(metrics.box.mr):.6f}")
    print("--------------------------------")
    print("Per-class results:")

    for class_id, class_name in class_names.items():
        precision, recall, ap50, _ = metrics.box.class_result(class_id)
        print(
            f"  {class_name:<10} mAP@50={float(ap50):.6f}  "
            f"P={float(precision):.6f}  R={float(recall):.6f}"
        )

    print("================================")
    if float(metrics.box.map50) >= 0.80:
        print("✅ V2 model meets FYP target (>80% mAP@50)")
    else:
        print("⚠️ V2 model below FYP target")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
