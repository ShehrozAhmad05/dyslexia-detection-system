"""Google Vision API OCR service for handwriting recognition."""

from __future__ import annotations

import logging
import os
import re
from pathlib import Path
from typing import Any

LOGGER = logging.getLogger(__name__)


class OCRService:
    """Service wrapper for Google Vision OCR extraction and normalization."""

    def __init__(self):
        """
        Initialize OCR service and Google Vision client from environment credentials.

        The `google.cloud.vision` import is intentionally inside this method so
        module import does not fail in environments where credentials are not yet set.
        """
        LOGGER.info("Initializing OCRService")
        project_root = Path(__file__).resolve().parents[2]
        env_path = project_root / "ml-models" / ".env"
        from dotenv import load_dotenv

        load_dotenv(dotenv_path=env_path)
        LOGGER.info("Environment loaded from %s", env_path)

        credentials_env = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "").strip()
        if not credentials_env:
            raise ValueError(
                "GOOGLE_APPLICATION_CREDENTIALS is not set. "
                "Set it in ml-models/.env or environment variables."
            )

        credentials_path = Path(credentials_env)
        if not credentials_path.is_absolute():
            credentials_path = project_root / credentials_path
        credentials_path = credentials_path.resolve()

        if not credentials_path.exists():
            raise ValueError(f"Google Vision credentials file not found: {credentials_path}")

        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(credentials_path)
        LOGGER.info("Using credentials file: %s", credentials_path)

        from google.cloud import vision  # Imported here by design.

        self._vision_module: Any = vision
        self.client = vision.ImageAnnotatorClient()
        LOGGER.info("Google Vision client initialized")

    def extract_text(self, image_bytes: bytes) -> str:
        """
        Extract text from handwriting image bytes using document_text_detection.

        Args:
            image_bytes: Raw image bytes.

        Returns:
            Extracted text string (may be empty).

        Raises:
            RuntimeError: If Google Vision API returns an error.
            ValueError: If image_bytes is empty or invalid.
        """
        LOGGER.info("Starting OCR extraction")
        if not isinstance(image_bytes, (bytes, bytearray)) or len(image_bytes) == 0:
            raise ValueError("image_bytes must be a non-empty bytes object.")

        image = self._vision_module.Image(content=bytes(image_bytes))
        response = self.client.document_text_detection(image=image)

        if response.error.message:
            error_message = f"Google Vision API error: {response.error.message}"
            LOGGER.error(error_message)
            raise RuntimeError(error_message)

        text = ""
        if response.full_text_annotation and response.full_text_annotation.text:
            text = response.full_text_annotation.text

        LOGGER.info("OCR extraction complete, characters extracted: %d", len(text))
        return text

    def normalize_text(self, text: str) -> str:
        """
        Normalize OCR text for robust sentence comparison.

        Steps:
        1. Lowercase
        2. Remove punctuation (keep letters and spaces)
        3. Merge multiple spaces
        4. Strip whitespace
        5. Merge split words made of isolated single letters
        6. Remove standalone single-character tokens except 'a' and 'i'
        7. Final punctuation artifact cleanup and whitespace normalization
        """
        LOGGER.info("Starting OCR text normalization")
        normalized = (text or "").lower()

        # Keep letters and spaces only.
        normalized = re.sub(r"[^a-z\s]", " ", normalized)
        normalized = re.sub(r"\s+", " ", normalized).strip()

        if not normalized:
            LOGGER.info("Normalization complete: empty result")
            return ""

        tokens = normalized.split()
        merged_tokens: list[str] = []
        single_char_buffer: list[str] = []

        for token in tokens:
            if len(token) == 1:
                single_char_buffer.append(token)
                continue

            if single_char_buffer:
                if len(single_char_buffer) >= 2:
                    merged_tokens.append("".join(single_char_buffer))
                else:
                    merged_tokens.extend(single_char_buffer)
                single_char_buffer = []

            merged_tokens.append(token)

        if single_char_buffer:
            if len(single_char_buffer) >= 2:
                merged_tokens.append("".join(single_char_buffer))
            else:
                merged_tokens.extend(single_char_buffer)

        filtered_tokens = [
            token for token in merged_tokens if len(token) > 1 or token in {"a", "i"}
        ]
        normalized = " ".join(filtered_tokens)

        # Final cleanup.
        normalized = re.sub(r"[^a-z\s]", " ", normalized)
        normalized = re.sub(r"\s+", " ", normalized).strip()
        LOGGER.info("Normalization complete, normalized length: %d", len(normalized))
        return normalized

    def extract_and_normalize(self, image_bytes: bytes) -> str:
        """
        Extract OCR text and normalize it in one call.

        Returns:
            Normalized text. Returns empty string if extraction fails.
        """
        LOGGER.info("Starting extract_and_normalize")
        try:
            extracted = self.extract_text(image_bytes)
            return self.normalize_text(extracted)
        except Exception as exc:
            LOGGER.exception("extract_and_normalize failed: %s", exc)
            return ""
