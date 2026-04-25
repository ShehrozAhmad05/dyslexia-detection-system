from .ocr_service import OCRService
from .risk_calculator import RiskCalculator
from .sentence_comparator import SentenceComparator
from .sentences import get_all_sentences, get_random_sentence

__all__ = [
    "OCRService",
    "SentenceComparator",
    "RiskCalculator",
    "get_random_sentence",
    "get_all_sentences",
]
