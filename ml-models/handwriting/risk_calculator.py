"""
Calculates dyslexia risk score from sentence comparison results.

Methodology:
  reversal_score (weight 60%):
    reversal_rate = reversal_count / total_words
    Non-linear scaling with noise floor and saturation.

  error_score (weight 40%):
    error_rate = (substitution + multi_error) / total_words
    Linear scaling capped at 100.

  Override rule:
    reversal_rate >= 0.20 => minimum score 34 (Medium Risk floor).
"""

from __future__ import annotations

from typing import Any


class RiskCalculator:
    """Calculate screening risk level from sentence comparison statistics."""

    REVERSAL_WEIGHT = 0.60
    ERROR_WEIGHT = 0.40
    REVERSAL_NOISE_FLOOR = 0.05
    REVERSAL_SATURATION = 0.30
    OVERRIDE_THRESHOLD = 0.20
    MEDIUM_RISK_FLOOR = 34

    def calculate(self, comparison_result: dict[str, Any]) -> dict[str, Any]:
        """
        Calculate risk from comparison result dict.

        Returns:
            Dictionary with rates, feature scores, overall score, risk level,
            override status, inability flag, and disclaimer.
        """
        total_words = int(comparison_result.get("total_words", 0) or 0)
        ocr_empty = bool(comparison_result.get("ocr_empty", False))

        if total_words == 0 or ocr_empty:
            return {
                "reversal_rate": 0.0,
                "error_rate": 0.0,
                "feature_scores": {
                    "reversal_score": 0.0,
                    "error_score": 0.0,
                },
                "overall_score": 0.0,
                "risk_level": "Unable to Assess",
                "override_applied": False,
                "unable_to_assess": True,
                "note": "No text detected in image",
                "disclaimer": self._get_disclaimer(),
            }

        reversal_count = int(comparison_result.get("reversal_count", 0) or 0)
        substitution_count = int(comparison_result.get("substitution_count", 0) or 0)
        multi_error_count = int(comparison_result.get("multi_error_count", 0) or 0)

        reversal_rate = reversal_count / total_words
        error_rate = (substitution_count + multi_error_count) / total_words

        reversal_score = self._calculate_reversal_score(reversal_rate)
        error_score = self._calculate_error_score(error_rate)
        overall_score = (
            reversal_score * self.REVERSAL_WEIGHT + error_score * self.ERROR_WEIGHT
        )

        override_applied = False
        if (
            reversal_rate >= self.OVERRIDE_THRESHOLD
            and overall_score < self.MEDIUM_RISK_FLOOR
        ):
            overall_score = float(self.MEDIUM_RISK_FLOOR)
            override_applied = True

        return {
            "reversal_rate": round(reversal_rate, 4),
            "error_rate": round(error_rate, 4),
            "feature_scores": {
                "reversal_score": round(reversal_score, 2),
                "error_score": round(error_score, 2),
            },
            "overall_score": round(overall_score, 2),
            "risk_level": self._get_risk_level(overall_score),
            "override_applied": override_applied,
            "unable_to_assess": False,
            "disclaimer": self._get_disclaimer(),
        }

    def _calculate_reversal_score(self, rate: float) -> float:
        """Calculate non-linear reversal score with floor/saturation behavior."""
        if rate <= self.REVERSAL_NOISE_FLOOR:
            return 0.0
        if rate >= self.REVERSAL_SATURATION:
            return 100.0

        scale = (rate - self.REVERSAL_NOISE_FLOOR) / (
            self.REVERSAL_SATURATION - self.REVERSAL_NOISE_FLOOR
        )
        return max(0.0, min(100.0, scale * 100.0))

    def _calculate_error_score(self, rate: float) -> float:
        """Calculate linear error score capped at 100."""
        return max(0.0, min(100.0, rate * 100.0))

    def _get_risk_level(self, score: float) -> str:
        """Return Low Risk, Medium Risk, or High Risk for given score."""
        if score <= 33:
            return "Low Risk"
        if score <= 66:
            return "Medium Risk"
        return "High Risk"

    def _get_disclaimer(self) -> str:
        """
        Return standard screening disclaimer with methodology references.

        Screening indicator only. Does not constitute clinical diagnosis.
        """
        return (
            "Screening indicator only. Does not constitute clinical diagnosis. "
            "Consult a qualified professional. Methodology: Isa et al. (2019), "
            "Brooks et al. (2011), Broman (1979), BHK Scale (Hamstra-Bletz & Blote, 1993)."
        )
