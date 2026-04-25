"""Phase D.1: Verify Google Vision OCR credentials and extraction."""

from __future__ import annotations

import io
import sys
from pathlib import Path

from dotenv import load_dotenv
from PIL import Image, ImageDraw, ImageFont


def _load_font(size: int) -> ImageFont.ImageFont:
    """Load a readable font at requested size with safe fallbacks."""
    for font_name in ("arial.ttf", "DejaVuSans.ttf"):
        try:
            return ImageFont.truetype(font_name, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


def main() -> None:
    """Create a test image and validate OCR extraction."""
    script_dir = Path(__file__).resolve().parent
    ml_models_dir = script_dir.parent

    load_dotenv(ml_models_dir / ".env")
    sys.path.insert(0, str(ml_models_dir))

    from handwriting import OCRService

    image = Image.new("RGB", (640, 100), color="white")
    draw = ImageDraw.Draw(image)
    font = _load_font(size=40)
    draw.text((20, 25), "the big dog can jump", fill="black", font=font)

    sample_image_path = script_dir / "test_handwriting_sample.png"
    image.save(sample_image_path)

    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    image_bytes = buffer.getvalue()

    ocr = OCRService()
    extracted = ocr.extract_and_normalize(image_bytes)

    print(f"Extracted text: {extracted}")
    if extracted.strip():
        print("Google Vision API: WORKING")
    else:
        print("Google Vision API: FAILED")


if __name__ == "__main__":
    main()
