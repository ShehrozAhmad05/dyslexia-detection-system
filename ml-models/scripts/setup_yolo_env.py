"""
Setup and validate YOLO environment for reversal detector training.

This script:
1. Validates ultralytics + torch installation
2. Detects available GPU/CPU runtime
3. Builds a training config with safe defaults for this machine
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

import yaml


ROOT_DIR = Path(__file__).resolve().parents[1]
TRAINING_DIR = ROOT_DIR / "handwriting" / "training"
CONFIG_PATH = TRAINING_DIR / "reversal_yolo_train.yaml"
DATASET_YAML = (
    Path(r"D:\FYP\Code\dyslexia-detection-system")
    / "data"
    / "processed"
    / "handwriting"
    / "synthdata_augmented"
    / "data.yaml"
)


def run_nvidia_smi() -> str | None:
    """Return one-line nvidia-smi output, or None if unavailable."""
    try:
        result = subprocess.run(
            [
                "nvidia-smi",
                "--query-gpu=name,memory.total,driver_version",
                "--format=csv,noheader",
            ],
            capture_output=True,
            text=True,
            timeout=15,
            check=False,
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip().splitlines()[0]
    except Exception:
        return None
    return None


def get_runtime(force_cpu: bool = False) -> dict:
    """Detect runtime and return device-related settings."""
    import torch

    gpu_visible = torch.cuda.is_available() and torch.cuda.device_count() > 0 and not force_cpu
    runtime: dict[str, str | int | float | bool | None] = {
        "device": "cpu",
        "gpu_name": None,
        "gpu_memory_gb": None,
        "cuda_available": False,
    }

    if gpu_visible:
        props = torch.cuda.get_device_properties(0)
        vram_gb = round(props.total_memory / (1024**3), 2)
        runtime.update(
            {
                "device": "cuda:0",
                "gpu_name": props.name,
                "gpu_memory_gb": vram_gb,
                "cuda_available": True,
            }
        )

    return runtime


def recommended_batch_size(runtime: dict) -> int:
    """Choose conservative batch size based on VRAM."""
    if runtime["device"] == "cpu":
        return 8

    vram_gb = float(runtime["gpu_memory_gb"] or 0)
    if vram_gb <= 4:
        return 8
    if vram_gb <= 8:
        return 16
    return 24


def build_training_config(runtime: dict, model: str, epochs: int) -> dict:
    """Build YOLO training config file contents."""
    return {
        "task": "detect",
        "model": model,
        "data": str(DATASET_YAML).replace("\\", "/"),
        "imgsz": 640,
        "epochs": epochs,
        "batch": recommended_batch_size(runtime),
        "device": runtime["device"],
        "workers": 2,
        "patience": 20,
        "project": str((ROOT_DIR / "logs" / "yolo_reversal").resolve()).replace("\\", "/"),
        "name": "reversal_detector",
        "exist_ok": True,
        "verbose": True,
        "seed": 42,
    }


def validate_dependencies() -> tuple[str, str]:
    """Validate core packages and return their versions."""
    import ultralytics
    import torch

    return ultralytics.__version__, torch.__version__


def main() -> int:
    parser = argparse.ArgumentParser(description="Setup YOLO runtime for reversal detector")
    parser.add_argument("--force-cpu", action="store_true", help="Force CPU runtime")
    parser.add_argument("--model", default="yolov8n.pt", help="Base YOLO model")
    parser.add_argument("--epochs", type=int, default=80, help="Training epochs")
    args = parser.parse_args()

    print("=" * 72)
    print("YOLO ENVIRONMENT SETUP")
    print("=" * 72)
    print(f"Python: {sys.executable}")
    print(f"Python version: {sys.version.split()[0]}")

    try:
        ultralytics_version, torch_version = validate_dependencies()
    except Exception as exc:
        print(f"ERROR: Missing dependency: {exc}")
        return 1

    print(f"ultralytics: {ultralytics_version}")
    print(f"torch: {torch_version}")

    nvidia_info = run_nvidia_smi()
    if nvidia_info:
        print(f"nvidia-smi: {nvidia_info}")
    else:
        print("nvidia-smi: Not available")

    runtime = get_runtime(force_cpu=args.force_cpu)
    print(f"runtime device: {runtime['device']}")
    if runtime["gpu_name"]:
        print(f"gpu: {runtime['gpu_name']} ({runtime['gpu_memory_gb']} GB)")
    else:
        print("gpu: Not active in torch runtime")

    if nvidia_info and runtime["device"] == "cpu" and not args.force_cpu:
        print("\nNOTE: NVIDIA GPU detected but torch is running CPU mode.")
        print("To enable GPU training, install CUDA wheel:")
        print(
            "python -m pip install torch==2.11.0+cu128 torchvision==0.26.0+cu128 "
            "--index-url https://download.pytorch.org/whl/cu128"
        )

    TRAINING_DIR.mkdir(parents=True, exist_ok=True)
    config = build_training_config(runtime, model=args.model, epochs=args.epochs)
    with CONFIG_PATH.open("w", encoding="utf-8") as f:
        yaml.safe_dump(config, f, sort_keys=False)

    print(f"\nCreated training config: {CONFIG_PATH}")
    print(f"Recommended batch size: {config['batch']}")
    print("=" * 72)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
