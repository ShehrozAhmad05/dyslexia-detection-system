"""
Train YOLOv8n v2 reversal detector on synthetic word images.

Run from project root:
    python ml-models/scripts/train_reversal_yolo_v2.py
"""

from __future__ import annotations

import csv
import shutil
from datetime import datetime
from pathlib import Path
from typing import Any

import torch
import yaml
from ultralytics import YOLO


def load_yaml(path: Path) -> dict[str, Any]:
    """Load YAML file and validate dict structure."""
    with path.open("r", encoding="utf-8") as file:
        data = yaml.safe_load(file)
    if not isinstance(data, dict):
        raise ValueError(f"Invalid YAML structure in {path}")
    return data


def parse_actual_epochs(results_csv_path: Path, fallback_epochs: int) -> int:
    """Get actual trained epochs from results.csv, handling early stopping."""
    if not results_csv_path.exists():
        return fallback_epochs

    epoch_values: list[int] = []
    with results_csv_path.open("r", encoding="utf-8", newline="") as csv_file:
        reader = csv.DictReader(csv_file)
        for row in reader:
            value = row.get("epoch")
            if value:
                epoch_values.append(int(float(value)))

    if not epoch_values:
        return fallback_epochs
    return max(epoch_values) + 1


def parse_final_maps(results_csv_path: Path) -> tuple[float | None, float | None]:
    """Read final mAP50 and mAP50-95 from YOLO results.csv."""
    if not results_csv_path.exists():
        return None, None

    map50 = None
    map50_95 = None
    with results_csv_path.open("r", encoding="utf-8", newline="") as csv_file:
        reader = csv.DictReader(csv_file)
        for row in reader:
            map50_value = row.get("metrics/mAP50(B)") or row.get("metrics/mAP50")
            map95_value = row.get("metrics/mAP50-95(B)") or row.get("metrics/mAP50-95")
            if map50_value is not None:
                map50 = float(map50_value)
            if map95_value is not None:
                map50_95 = float(map95_value)
    return map50, map50_95


def select_best_weights(model: YOLO, run_dir: Path) -> Path:
    """Resolve best.pt path from standard YOLO output or trainer state."""
    expected = run_dir / "weights" / "best.pt"
    if expected.exists():
        return expected

    trainer = getattr(model, "trainer", None)
    if trainer is not None:
        trainer_best = Path(str(getattr(trainer, "best", "")))
        if trainer_best.exists():
            return trainer_best

    raise FileNotFoundError(f"best.pt not found at expected location: {expected}")


def main() -> int:
    """Run YOLO v2 training and export final model + summary."""
    project_root = Path(__file__).resolve().parents[2]
    ml_models_root = project_root / "ml-models"
    config_path = (
        ml_models_root / "handwriting" / "training" / "reversal_yolo_v2_train.yaml"
    )

    config = load_yaml(config_path)

    data_path = Path(str(config["data"]))
    if not data_path.exists():
        print(f"ERROR: data.yaml not found: {data_path}")
        return 1

    cuda_available = torch.cuda.is_available()
    if not cuda_available:
        print("WARNING: GPU not available, training will use CPU")
        device_summary = "CPU"
    else:
        gpu_name = torch.cuda.get_device_name(0)
        device_summary = f"GPU ({gpu_name})"

    output_dir = Path(str(config["project"])) / str(config["name"])
    try:
        output_rel = (
            str(output_dir.resolve().relative_to(project_root.resolve())).replace("\\", "/")
            + "/"
        )
    except ValueError:
        output_rel = str(output_dir.resolve()).replace("\\", "/") + "/"
    print("================================")
    print("PHASE 3 — YOLO v2 TRAINING")
    print("================================")
    print("Model:    yolov8n.pt")
    print("Dataset:  synthetic_words (12,000 train / 3,000 val)")
    print("Classes:  Normal, Reversal, Corrected")
    print("Epochs:   100")
    print("Batch:    16")
    print(f"Device:   {device_summary}")
    print(f"Output:   {output_rel}")
    print("================================")

    model = YOLO("yolov8n.pt")
    train_kwargs = {
        "data": config["data"],
        "epochs": config["epochs"],
        "batch": config["batch"],
        "imgsz": config["imgsz"],
        "device": config["device"],
        "workers": config["workers"],
        "patience": config["patience"],
        "project": config["project"],
        "name": config["name"],
        "exist_ok": config["exist_ok"],
        "verbose": config["verbose"],
        "seed": config["seed"],
    }
    _ = model.train(**train_kwargs)

    run_dir = output_dir
    best_weights = select_best_weights(model, run_dir).resolve()
    results_csv = run_dir / "results.csv"
    actual_epochs = parse_actual_epochs(results_csv, int(config["epochs"]))
    map50, map50_95 = parse_final_maps(results_csv)

    print("Training complete.")
    print(f"Best weights: {best_weights}")
    print(f"Epochs trained: {actual_epochs}")

    final_model_rel = Path("ml-models") / "handwriting" / "models" / "reversal_yolo_v2.pt"
    final_model_path = project_root / final_model_rel
    final_model_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(best_weights, final_model_path)
    print("Model saved to ml-models/handwriting/models/reversal_yolo_v2.pt")

    map50_for_target = map50 if map50 is not None else 0.0
    target_met = "YES" if map50_for_target > 0.80 else "NO"
    summary_path = (
        ml_models_root / "handwriting" / "training" / "reversal_yolo_v2_results.txt"
    )
    summary_lines = [
        f"Date and time of training: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "Model: yolov8n.pt",
        "Dataset: synthetic_words (12,000 train / 3,000 val)",
        "Classes: Normal, Reversal, Corrected",
        f"Epochs trained: {actual_epochs}",
        f"Final mAP@50: {map50:.6f}" if map50 is not None else "Final mAP@50: N/A",
        f"Final mAP@50-95: {map50_95:.6f}"
        if map50_95 is not None
        else "Final mAP@50-95: N/A",
        "Path to saved model: ml-models/handwriting/models/reversal_yolo_v2.pt",
        f"FYP target met (>80% mAP@50): {target_met}",
    ]
    summary_path.write_text("\n".join(summary_lines) + "\n", encoding="utf-8")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
