"""YOLO-based reversal detector for handwriting inference."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import numpy as np
from ultralytics import YOLO


CLASS_MAP = {
    0: "Normal",
    1: "Reversal",
    2: "Corrected",
}


class ReversalDetector:
    """Run YOLO inference and return normalized letter detections."""

    def __init__(self, model_path: str | Path | None = None):
        """
        Initialize YOLO detector with trained model.

        Args:
            model_path: path to reversal_yolo_v2.pt, or None for auto-resolve.
        """
        if model_path is None:
            resolved_model_path = self._resolve_model_path()
        else:
            candidate = Path(model_path).expanduser()
            resolved_model_path = (
                candidate if candidate.is_absolute() else (Path.cwd() / candidate)
            )

        self.model_path = resolved_model_path
        self.model = self._load_model(self.model_path)

    def _resolve_model_path(self) -> Path:
        """
        Auto-detect model path from project structure.

        Looks for reversal_yolo_v2.pt in:
            ml-models/handwriting/models/
        """
        ml_models_root = Path(__file__).resolve().parents[2]
        return ml_models_root / "handwriting" / "models" / "reversal_yolo_v2.pt"

    def _load_model(self, model_path: Path) -> YOLO:
        """Load YOLO model from path with error handling."""
        if not model_path.exists():
            raise FileNotFoundError(
                f"Model file not found at expected path: {model_path.resolve()}"
            )
        return YOLO(str(model_path))

    def detect(self, image: np.ndarray) -> list[dict[str, Any]]:
        """
        Run YOLO inference on preprocessed image.

        Args:
            image: preprocessed numpy array (BGR, uint8).

        Returns:
            Left-to-right sorted list of normalized detection dictionaries.
        """
        if not isinstance(image, np.ndarray) or image.size == 0:
            raise ValueError("Input image is empty or invalid.")
        if image.dtype != np.uint8:
            raise ValueError("Input image must be uint8.")
        if image.ndim != 3 or image.shape[2] != 3:
            raise ValueError("Input image must be a BGR 3-channel numpy array.")

        prediction = self.model.predict(
            source=image,
            conf=0.25,
            verbose=False,
        )
        if not prediction:
            return []

        result = prediction[0]
        if result.boxes is None or len(result.boxes) == 0:
            return []

        names = result.names if isinstance(result.names, dict) else {}
        detections: list[dict[str, Any]] = []

        for box in result.boxes:
            class_id = int(box.cls.item())
            confidence = float(box.conf.item())
            x1, y1, x2, y2 = [float(v) for v in box.xyxy[0].tolist()]
            class_name = CLASS_MAP.get(
                class_id, str(names.get(class_id, f"class_{class_id}"))
            )
            cx = (x1 + x2) / 2.0
            cy = (y1 + y2) / 2.0

            detections.append(
                {
                    "class_id": class_id,
                    "class_name": class_name,
                    "confidence": confidence,
                    "bbox": {
                        "x1": x1,
                        "y1": y1,
                        "x2": x2,
                        "y2": y2,
                        "cx": cx,
                        "cy": cy,
                    },
                }
            )

        detections.sort(key=lambda item: float(item["bbox"]["x1"]))
        return detections
