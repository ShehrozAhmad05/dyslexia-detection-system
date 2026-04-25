"""
Compares OCR-extracted text against expected sentence.
Detects reversal, substitution, and multi-character errors.
Uses word-level Levenshtein alignment for robust comparison.
"""

from __future__ import annotations

from itertools import zip_longest
from typing import Any


REVERSAL_PAIRS = {
    ("b", "d"),
    ("d", "b"),
    ("p", "q"),
    ("q", "p"),
    ("n", "u"),
    ("u", "n"),
    ("m", "w"),
    ("w", "m"),
    ("s", "z"),
    ("z", "s"),
}


class SentenceComparator:
    """Compare expected and detected sentence text at word-level."""

    def compare(self, expected: str, detected: str) -> dict[str, Any]:
        """
        Compare expected sentence with OCR-detected text.

        Args:
            expected: normalized expected sentence.
            detected: normalized OCR-detected text.

        Returns:
            Comparison result containing alignment, per-word classification,
            and aggregate counts.
        """
        expected_words = expected.split() if expected else []
        detected_words = detected.split() if detected else []
        total_words = len(expected_words)

        if not detected.strip():
            return {
                "expected_words": expected_words,
                "detected_words": detected_words,
                "total_words": total_words,
                "aligned_pairs": [],
                "word_results": [],
                "reversal_count": 0,
                "substitution_count": 0,
                "multi_error_count": 0,
                "correct_count": 0,
                "ocr_empty": True,
            }

        aligned_pairs = self._align_words(expected_words, detected_words)

        reversal_count = 0
        substitution_count = 0
        multi_error_count = 0
        correct_count = 0
        word_results: list[dict[str, Any]] = []

        for position, (expected_word, written_word) in enumerate(aligned_pairs, start=1):
            classification = self._classify_word(expected_word, written_word)
            error_type = classification["error_type"]
            detail = classification["detail"]

            if error_type == "correct":
                correct_count += 1
            elif error_type == "reversal":
                reversal_count += 1
            elif error_type == "substitution":
                substitution_count += 1
            else:
                multi_error_count += 1

            word_results.append(
                {
                    "position": position,
                    "expected_word": expected_word,
                    "written_word": written_word,
                    "error_type": error_type,
                    "detail": detail,
                }
            )

        return {
            "expected_words": expected_words,
            "detected_words": detected_words,
            "total_words": total_words,
            "aligned_pairs": aligned_pairs,
            "word_results": word_results,
            "reversal_count": reversal_count,
            "substitution_count": substitution_count,
            "multi_error_count": multi_error_count,
            "correct_count": correct_count,
            "ocr_empty": False,
        }

    def _align_words(
        self, expected_words: list[str], detected_words: list[str]
    ) -> list[tuple[str, str]]:
        """
        Hybrid word alignment strategy.

        If length difference <= 2:
            Use simple zip_longest alignment.

        If length difference > 2:
            Use full Levenshtein DP alignment.

        Returns:
            List of (expected_word, detected_word) tuples.
            Missing words are represented as empty string.
        """
        diff = abs(len(expected_words) - len(detected_words))

        if diff <= 2:
            from itertools import zip_longest

            return [
                (e or "", d or "")
                for e, d in zip_longest(
                    expected_words,
                    detected_words,
                    fillvalue="",
                )
            ]

        return self._levenshtein_align(expected_words, detected_words)

    def _levenshtein_align(
        self, expected_words: list[str], detected_words: list[str]
    ) -> list[tuple[str, str]]:
        """
        Align word lists using word-level Levenshtein alignment.

        Operations:
          - match/substitution via diagonal move
          - deletion via up move
          - insertion via left move
        """
        n = len(expected_words)
        m = len(detected_words)

        dp = [[0] * (m + 1) for _ in range(n + 1)]
        for i in range(1, n + 1):
            dp[i][0] = i
        for j in range(1, m + 1):
            dp[0][j] = j

        for i in range(1, n + 1):
            for j in range(1, m + 1):
                substitution_cost = 0 if expected_words[i - 1] == detected_words[j - 1] else 1
                diagonal = dp[i - 1][j - 1] + substitution_cost
                up = dp[i - 1][j] + 1
                left = dp[i][j - 1] + 1
                dp[i][j] = min(diagonal, up, left)

        aligned_pairs: list[tuple[str, str]] = []
        i, j = n, m
        while i > 0 or j > 0:
            if i > 0 and j > 0:
                substitution_cost = (
                    0 if expected_words[i - 1] == detected_words[j - 1] else 1
                )
                if dp[i][j] == dp[i - 1][j - 1] + substitution_cost:
                    aligned_pairs.append((expected_words[i - 1], detected_words[j - 1]))
                    i -= 1
                    j -= 1
                    continue

            if i > 0 and dp[i][j] == dp[i - 1][j] + 1:
                aligned_pairs.append((expected_words[i - 1], ""))
                i -= 1
            else:
                aligned_pairs.append(("", detected_words[j - 1]))
                j -= 1

        aligned_pairs.reverse()
        return aligned_pairs

    def _classify_word(self, expected_word: str, written_word: str) -> dict[str, str | None]:
        """
        Classify a single word pair.

        Rules:
        1. identical => correct
        2. missing written word => deleted
        3. length difference > 2 => multi_error
        4. for small differences, classify by character diffs
        """
        if expected_word == written_word:
            return {"error_type": "correct", "detail": None}

        if expected_word == "" and written_word != "":
            return {"error_type": "multi_error", "detail": "extra word"}

        if written_word == "":
            return {"error_type": "deleted", "detail": "missing word"}

        length_diff = abs(len(expected_word) - len(written_word))
        if length_diff > 2:
            return {"error_type": "multi_error", "detail": "length difference too large"}

        if len(expected_word) == len(written_word):
            diffs = self._get_char_diffs(expected_word, written_word)
        else:
            diffs = []
            for index, (from_char, to_char) in enumerate(
                zip_longest(expected_word, written_word, fillvalue="")
            ):
                if from_char != to_char:
                    diffs.append(
                        {"pos": index, "from_char": from_char, "to_char": to_char}
                    )

        if not diffs:
            return {"error_type": "correct", "detail": None}

        if self._check_all_reversals(diffs):
            detail = ", ".join(
                f"{item['from_char']}->{item['to_char']}" for item in diffs
            )
            return {"error_type": "reversal", "detail": detail}

        if 1 <= len(diffs) <= 3:
            detail = ", ".join(
                f"{item['from_char']}->{item['to_char']}" for item in diffs
            )
            return {"error_type": "substitution", "detail": detail}

        return {"error_type": "multi_error", "detail": "multiple character errors"}

    def _get_char_diffs(self, word1: str, word2: str) -> list[dict[str, Any]]:
        """
        Get character differences between two words.

        Handles same-length words only and returns a list of:
        {pos, from_char, to_char}.
        """
        if len(word1) != len(word2):
            raise ValueError("_get_char_diffs expects words of equal length.")

        differences: list[dict[str, Any]] = []
        for index, (from_char, to_char) in enumerate(zip(word1, word2)):
            if from_char != to_char:
                differences.append(
                    {"pos": index, "from_char": from_char, "to_char": to_char}
                )
        return differences

    def _check_all_reversals(self, diffs: list[dict[str, Any]]) -> bool:
        """Return True if all character differences are known reversal pairs."""
        if not diffs:
            return False
        return all((item["from_char"], item["to_char"]) in REVERSAL_PAIRS for item in diffs)
