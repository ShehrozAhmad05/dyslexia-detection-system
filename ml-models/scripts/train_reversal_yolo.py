"""
Train YOLOv8 reversal detector, save final model, and write training summary.

Run from project root:
    python ml-models/scripts/train_reversal_yolo.py
"""

from __future__ import annotations

import csv
import shutil
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


def parse_actual_epochs(results_csv_path: Path, fallback_epochs: int) -> int:
    if not results_csv_path.exists():
        return fallback_epochs

    epoch_values: list[int] = []
    with results_csv_path.open("r", encoding="utf-8", newline="") as csv_file:
        reader = csv.DictReader(csv_file)
        for row in reader:
            epoch_value = row.get("epoch")
            if epoch_value is None or epoch_value == "":
                continue
            epoch_values.append(int(float(epoch_value)))

    if not epoch_values:
        return fallback_epochs

    return max(epoch_values) + 1


def select_best_weights(model: YOLO, run_dir: Path) -> Path:
    expected_path = run_dir / "weights" / "best.pt"
    if expected_path.exists():
        return expected_path

    trainer = getattr(model, "trainer", None)
    if trainer is not None:
        trainer_best = Path(str(getattr(trainer, "best", "")))
        if trainer_best.exists():
            return trainer_best

    raise FileNotFoundError(f"best.pt not found at expected location: {expected_path}")


def main() -> int:
    project_root = Path(__file__).resolve().parents[2]
    ml_models_root = project_root / "ml-models"

    config_path = ml_models_root / "handwriting" / "training" / "reversal_yolo_train.yaml"
    config = load_yaml(config_path)

    model_name = str(config.get("model", "yolov8n.pt"))
    print("=== YOLO Reversal Training ===")
    print(f"Config: {config_path}")
    print(f"Model: {model_name}")
    print(f"Dataset YAML: {config.get('data')}")

    model = YOLO(model_name)
    train_kwargs = dict(config)
    train_kwargs.pop("model", None)

    model.train(**train_kwargs)

    run_dir = Path(str(config["project"])) / str(config["name"])
    best_weights = select_best_weights(model, run_dir).resolve()
    print(f"Training complete. Best weights saved at: {best_weights}")

    final_model_path = ml_models_root / "handwriting" / "models" / "reversal_yolo.pt"
    final_model_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(best_weights, final_model_path)
    print("✅ Model saved to ml-models/handwriting/models/reversal_yolo.pt")

    val_model = YOLO(str(best_weights))
    val_kwargs = {
        "data": config["data"],
        "split": "val",
        "device": config.get("device"),
        "imgsz": config.get("imgsz"),
        "batch": config.get("batch"),
        "workers": config.get("workers"),
        "verbose": False,
    }
    val_kwargs = {key: value for key, value in val_kwargs.items() if value is not None}
    metrics = val_model.val(**val_kwargs)

    map50 = float(metrics.box.map50)
    map50_95 = float(metrics.box.map)
    met_target = map50 >= 0.80
    configured_epochs = int(config.get("epochs", 80))
    actual_epochs = parse_actual_epochs(run_dir / "results.csv", configured_epochs)

    summary_path = ml_models_root / "handwriting" / "training" / "reversal_yolo_results.txt"
    summary_lines = [
        f"Date and time of training: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "Model: yolov8n.pt",
        "Dataset: synthdata_augmented (3746 train / 1732 val)",
        "Classes: Normal, Reversal, Corrected",
        f"Epochs trained: {actual_epochs}",
        f"Final mAP@50: {map50:.6f}",
        f"Final mAP@50-95: {map50_95:.6f}",
        f"Path to saved model weights: {str(final_model_path.resolve()).replace('\\\\', '/')}",
        f"FYP target met (>80% mAP@50): {'YES' if met_target else 'NO'}",
    ]
    summary_path.write_text("\n".join(summary_lines) + "\n", encoding="utf-8")
    print(f"Training summary written to: {summary_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
