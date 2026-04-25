"""Phase D.2: End-to-end handwriting pipeline test without FastAPI server."""

from __future__ import annotations

import io
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


def _load_font(size: int) -> ImageFont.ImageFont:
    """Load a font with fallbacks for local environment differences."""
    for font_name in ("arial.ttf", "DejaVuSans.ttf"):
        try:
            return ImageFont.truetype(font_name, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


def main() -> None:
    """Run all three pipeline test cases in required order."""
    project_root = Path(__file__).resolve().parents[2]
    scripts_dir = project_root / "ml-models" / "scripts"

    sys.path.insert(0, str(project_root / "ml-models"))
    from handwriting import OCRService, RiskCalculator, SentenceComparator

    print("=" * 50)
    print("TEST CASE 1 — OCR on printed test image")
    print("=" * 50)
    image_path = scripts_dir / "test_handwriting_sample.png"
    image_bytes = image_path.read_bytes()

    ocr = OCRService()
    detected = ocr.extract_and_normalize(image_bytes)
    expected = "the big dog can jump"

    print(f"Expected:  {expected}")
    print(f"Detected:  {detected}")

    comp = SentenceComparator()
    result = comp.compare(expected, detected)
    print(f"Reversals: {result['reversal_count']}")
    print(f"Errors:    {result['substitution_count'] + result['multi_error_count']}")

    calc = RiskCalculator()
    risk = calc.calculate(result)
    print(f"Score:     {risk['overall_score']}")
    print(f"Risk:      {risk['risk_level']}")

    print()
    print("=" * 50)
    print("TEST CASE 2 — Simulated reversal (bog vs dog)")
    print("=" * 50)

    img = Image.new("RGB", (640, 100), color="white")
    draw = ImageDraw.Draw(img)
    draw.text((20, 25), "the big bog can jump", fill="black", font=_load_font(size=40))
    reversal_image_path = scripts_dir / "test_reversal_sample.png"
    img.save(reversal_image_path)

    reversal_bytes = reversal_image_path.read_bytes()
    detected_reversal = ocr.extract_and_normalize(reversal_bytes)
    expected_reversal = "the big dog can jump"

    print(f"Expected:  {expected_reversal}")
    print(f"Detected:  {detected_reversal}")

    result2 = comp.compare(expected_reversal, detected_reversal)
    print(f"Reversals: {result2['reversal_count']}")
    print("Word results:")
    for wr in result2["word_results"]:
        if wr["error_type"] != "correct":
            print(
                f"  {wr['expected_word']} -> {wr['written_word']}"
                f" ({wr['error_type']}) {wr['detail'] or ''}"
            )

    risk2 = calc.calculate(result2)
    print(f"Score:     {risk2['overall_score']}")
    print(f"Risk:      {risk2['risk_level']}")
    print(f"Override:  {risk2['override_applied']}")

    print()
    print("=" * 50)
    print("TEST CASE 3 — Empty OCR handling")
    print("=" * 50)

    black_img = Image.new("RGB", (640, 100), color="black")
    buf = io.BytesIO()
    black_img.save(buf, format="PNG")
    black_bytes = buf.getvalue()

    detected_empty = ocr.extract_and_normalize(black_bytes)
    result3 = comp.compare("the big dog can jump", detected_empty)
    risk3 = calc.calculate(result3)
    print(f"OCR empty: {result3['ocr_empty']}")
    print(f"Risk:      {risk3['risk_level']}")
    print(f"Unable:    {risk3['unable_to_assess']}")

    print()
    print("All pipeline tests complete")


if __name__ == "__main__":
    main()
