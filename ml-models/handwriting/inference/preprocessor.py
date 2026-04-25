"""Image preprocessing utilities for handwriting inference input preparation."""

from __future__ import annotations

from pathlib import Path
from typing import Union

import cv2
import numpy as np


ImageInput = Union[str, Path, bytes, np.ndarray]


class HandwritingPreprocessor:
    """Preprocess raw handwriting photos for downstream YOLO inference."""

    def load_image(self, image_input: ImageInput) -> np.ndarray:
        """Load image from path, bytes, or numpy array."""
        image: np.ndarray | None

        if isinstance(image_input, (str, Path)):
            image_path = Path(image_input)
            image = cv2.imread(str(image_path), cv2.IMREAD_UNCHANGED)
        elif isinstance(image_input, bytes):
            image_bytes = np.frombuffer(image_input, dtype=np.uint8)
            image = cv2.imdecode(image_bytes, cv2.IMREAD_UNCHANGED)
        elif isinstance(image_input, np.ndarray):
            image = image_input.copy()
        else:
            raise ValueError(
                "Unsupported image_input type. Expected path, bytes, or numpy array."
            )

        if image is None or image.size == 0:
            raise ValueError("Unable to load image from provided input.")

        return image

    def deskew(self, gray_image: np.ndarray) -> np.ndarray:
        """Detect and correct tilt in handwriting image."""
        try:
            _, binary = cv2.threshold(
                gray_image, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU
            )
            contours, _ = cv2.findContours(
                binary, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE
            )

            if not contours:
                return gray_image

            all_points = np.vstack(contours)
            rect = cv2.minAreaRect(all_points)
            angle = float(rect[-1])

            if angle > 45.0:
                angle = 90.0 - angle
            elif angle < -45.0:
                angle = 90.0 + angle

            if abs(angle) < 1.0:
                return gray_image

            height, width = gray_image.shape[:2]
            center = (width / 2.0, height / 2.0)
            rotation_matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
            return cv2.warpAffine(
                gray_image,
                rotation_matrix,
                (width, height),
                flags=cv2.INTER_CUBIC,
                borderMode=cv2.BORDER_REPLICATE,
            )
        except Exception:
            return gray_image

    def preprocess(self, image_input: ImageInput) -> np.ndarray:
        """
        Preprocess a raw handwriting photo for YOLO inference.

        Args:
            image_input: path, bytes, or numpy array image input.

        Returns:
            Preprocessed BGR uint8 image with original aspect ratio.
        """
        image = self.load_image(image_input)

        if image.ndim == 2:
            gray = image
        elif image.ndim == 3 and image.shape[2] == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        elif image.ndim == 3 and image.shape[2] == 4:
            gray = cv2.cvtColor(image, cv2.COLOR_BGRA2GRAY)
        else:
            raise ValueError("Unsupported image format. Expected grayscale, BGR, or BGRA.")

        denoised = cv2.fastNlMeansDenoising(gray, None, h=10)
        deskewed = self.deskew(denoised)
        normalized = cv2.equalizeHist(deskewed)
        preprocessed_bgr = cv2.cvtColor(normalized, cv2.COLOR_GRAY2BGR)

        return preprocessed_bgr.astype(np.uint8, copy=False)
