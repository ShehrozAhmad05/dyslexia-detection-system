"""Risk scoring utilities for dyslexia handwriting screening inference output."""

from __future__ import annotations

from typing import Any


class RiskCalculator:
    """
    Calculate screening risk indicators from YOLO letter detections.

    The threshold is intentionally conservative for screening (not diagnosis).
    """

    RISK_THRESHOLD = 0.20

    def _get_risk_level(self, reversal_ratio: float) -> tuple[str, bool]:
        """Return (risk_level_string, risk_flag_bool)."""
        if reversal_ratio >= self.RISK_THRESHOLD:
            return "At Risk", True
        return "Low Risk", False

    def _build_primary_indicator(self, reversal_count: int, total: int) -> str:
        """
        Build human-readable primary indicator string.

        Example: "5 out of 20 letters show reversal patterns".
        """
        return f"{reversal_count} out of {total} letters show reversal patterns"

    def _build_supporting_indicator(self, corrected_count: int, total: int) -> str:
        """
        Build human-readable supporting indicator string.

        Example: "3 correction marks detected, suggesting awareness of letter
        orientation difficulty".
        """
        if corrected_count == 0:
            return "0 correction marks detected"
        return (
            f"{corrected_count} correction marks detected out of {total} letters, "
            "suggesting awareness of letter orientation difficulty"
        )

    def _build_disclaimer(self) -> str:
        """
        Return standard disclaimer string.

        "This is a screening indicator only and does not constitute a clinical
        diagnosis. Please consult a qualified professional for assessment."
        """
        return (
            "This is a screening indicator only and does not constitute a clinical "
            "diagnosis. Please consult a qualified professional for assessment."
        )

    def calculate(self, detections: list[dict[str, Any]]) -> dict[str, Any]:
        """
        Calculate dyslexia risk from YOLO detections.

        Args:
            detections: list of detection dicts from ReversalDetector.

        Returns:
            risk_result dictionary with counts, percentages, and risk summary.
        """
        total_letters = len(detections)
        if total_letters == 0:
            return {
                "total_letters": 0,
                "normal_count": 0,
                "reversal_count": 0,
                "corrected_count": 0,
                "normal_pct": 0.0,
                "reversal_pct": 0.0,
                "corrected_pct": 0.0,
                "reversal_ratio": 0.0,
                "risk_level": "Unable to assess",
                "risk_flag": False,
                "primary_indicator": "No letters detected in image",
                "supporting_indicator": "No letters detected in image",
                "disclaimer": self._build_disclaimer(),
            }

        normal_count = 0
        reversal_count = 0
        corrected_count = 0

        for detection in detections:
            class_id = detection.get("class_id")
            class_name = str(detection.get("class_name", "")).strip().lower()
            if class_id == 0 or class_name == "normal":
                normal_count += 1
            elif class_id == 1 or class_name == "reversal":
                reversal_count += 1
            elif class_id == 2 or class_name == "corrected":
                corrected_count += 1

        normal_pct = round((normal_count / total_letters) * 100.0, 2)
        reversal_pct = round((reversal_count / total_letters) * 100.0, 2)
        corrected_pct = round((corrected_count / total_letters) * 100.0, 2)
        reversal_ratio = round(reversal_count / total_letters, 4)

        risk_level, risk_flag = self._get_risk_level(reversal_ratio)

        return {
            "total_letters": total_letters,
            "normal_count": normal_count,
            "reversal_count": reversal_count,
            "corrected_count": corrected_count,
            "normal_pct": normal_pct,
            "reversal_pct": reversal_pct,
            "corrected_pct": corrected_pct,
            "reversal_ratio": reversal_ratio,
            "risk_level": risk_level,
            "risk_flag": risk_flag,
            "primary_indicator": self._build_primary_indicator(
                reversal_count, total_letters
            ),
            "supporting_indicator": self._build_supporting_indicator(
                corrected_count, total_letters
            ),
            "disclaimer": self._build_disclaimer(),
        }
