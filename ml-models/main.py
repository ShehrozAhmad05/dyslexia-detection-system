"""
FastAPI server for ML model inference
Handles requests from Node.js backend for dyslexia detection
"""

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
import uvicorn
import numpy as np
from dotenv import load_dotenv
import os
from typing import Dict, List
import logging
import time
import uuid

# Load environment variables
load_dotenv(Path(__file__).parent / ".env")

if not logging.getLogger().handlers:
    logging.basicConfig(
        level=os.getenv("LOG_LEVEL", "INFO").upper(),
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s"
    )

logger = logging.getLogger("ml_api.handwriting")

app = FastAPI(
    title="Dyslexia Detection ML API",
    description="Machine Learning models for multimodal dyslexia detection",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000"],  # Node.js backend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class WordResult(BaseModel):
    position: int
    expected_word: str
    written_word: str
    error_type: str
    detail: str | None


class FeatureScores(BaseModel):
    reversal_score: float
    error_score: float


class HandwritingResponse(BaseModel):
    expected_sentence: str
    detected_sentence: str
    total_words: int
    word_results: List[WordResult]
    reversal_count: int
    substitution_count: int
    multi_error_count: int
    correct_count: int
    reversal_rate: float
    error_rate: float
    feature_scores: FeatureScores
    overall_score: float
    risk_level: str
    override_applied: bool
    unable_to_assess: bool
    disclaimer: str

class KeystrokeRequest(BaseModel):
    timings: List[Dict]
    
class KeystrokeResponse(BaseModel):
    risk_score: float
    anomaly_score: float
    features: Dict

class ReadingRequest(BaseModel):
    metrics: Dict
    
class ReadingResponse(BaseModel):
    risk_score: float
    reading_difficulty_score: float
    features: Dict

# Health check
@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "Dyslexia Detection ML API",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "models_loaded": True}


@app.get("/api/ml/handwriting/sentence")
async def get_screening_sentence():
    """
    Returns a randomly selected screening sentence.
    Called when handwriting page loads.
    Frontend displays this sentence to the user.
    """
    try:
        import sys

        sys.path.insert(0, str(Path(__file__).parent))
        from handwriting import get_random_sentence

        sentence = get_random_sentence()
        return {
            "sentence": sentence,
            "word_count": len(sentence.split()),
            "instruction": "Please write this sentence in print style",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Handwriting analysis endpoint
@app.post("/api/ml/handwriting/analyze", response_model=HandwritingResponse)
async def analyze_handwriting(
    file: UploadFile = File(...),
    expected_sentence: str = Form(...),
):
    """
    Analyze handwriting image for dyslexia indicators.

    Args:
        file: uploaded handwriting image.
        expected_sentence: the sentence user was asked to write.

    Returns:
        HandwritingResponse with risk score and analysis.
    """
    request_id = str(uuid.uuid4())[:8]
    started_at = time.perf_counter()

    logger.info(
        "[%s] Handwriting analysis started: filename=%s content_type=%s expected_chars=%d",
        request_id,
        file.filename or "unknown",
        file.content_type or "unknown",
        len(expected_sentence or "")
    )

    try:
        import sys

        sys.path.insert(0, str(Path(__file__).parent))
        from handwriting import OCRService, SentenceComparator, RiskCalculator

        image_bytes = await file.read()
        logger.info(
            "[%s] File read completed: bytes=%d",
            request_id,
            len(image_bytes)
        )
        if not image_bytes:
            logger.warning("[%s] Empty image payload received", request_id)
            raise HTTPException(status_code=400, detail="Empty image file")

        ocr = OCRService()
        detected_text = ocr.extract_and_normalize(image_bytes)
        normalized_expected = ocr.normalize_text(expected_sentence)
        logger.info(
            "[%s] OCR completed: expected_words=%d detected_words=%d",
            request_id,
            len(normalized_expected.split()),
            len(detected_text.split())
        )

        comparator = SentenceComparator()
        comparison = comparator.compare(normalized_expected, detected_text)
        logger.info(
            "[%s] Comparison completed: total_words=%d reversals=%d substitutions=%d multi_errors=%d correct=%d",
            request_id,
            comparison["total_words"],
            comparison["reversal_count"],
            comparison["substitution_count"],
            comparison["multi_error_count"],
            comparison["correct_count"]
        )

        calculator = RiskCalculator()
        risk = calculator.calculate(comparison)
        logger.info(
            "[%s] Risk calculated: overall_score=%.2f risk_level=%s override_applied=%s unable_to_assess=%s",
            request_id,
            risk["overall_score"],
            risk["risk_level"],
            risk["override_applied"],
            risk["unable_to_assess"]
        )

        duration_ms = (time.perf_counter() - started_at) * 1000
        logger.info("[%s] Handwriting analysis succeeded in %.1fms", request_id, duration_ms)

        return HandwritingResponse(
            expected_sentence=normalized_expected,
            detected_sentence=detected_text,
            total_words=comparison["total_words"],
            word_results=[WordResult(**wr) for wr in comparison["word_results"]],
            reversal_count=comparison["reversal_count"],
            substitution_count=comparison["substitution_count"],
            multi_error_count=comparison["multi_error_count"],
            correct_count=comparison["correct_count"],
            reversal_rate=risk["reversal_rate"],
            error_rate=risk["error_rate"],
            feature_scores=FeatureScores(
                reversal_score=risk["feature_scores"]["reversal_score"],
                error_score=risk["feature_scores"]["error_score"],
            ),
            overall_score=risk["overall_score"],
            risk_level=risk["risk_level"],
            override_applied=risk["override_applied"],
            unable_to_assess=risk["unable_to_assess"],
            disclaimer=risk["disclaimer"],
        )
    except HTTPException as http_err:
        duration_ms = (time.perf_counter() - started_at) * 1000
        logger.warning(
            "[%s] Handwriting analysis failed with HTTP %s in %.1fms: %s",
            request_id,
            http_err.status_code,
            duration_ms,
            http_err.detail
        )
        raise
    except Exception as e:
        duration_ms = (time.perf_counter() - started_at) * 1000
        logger.exception("[%s] Handwriting analysis crashed in %.1fms", request_id, duration_ms)
        raise HTTPException(status_code=500, detail=str(e))

# Keystroke analysis endpoint
@app.post("/api/ml/keystroke/analyze", response_model=KeystrokeResponse)
async def analyze_keystroke(data: KeystrokeRequest):
    """
    Analyze keystroke timing patterns for anomalies
    """
    try:
        # TODO: Extract features, run anomaly detection
        return KeystrokeResponse(
            risk_score=0.55,
            anomaly_score=0.48,
            features={
                "avg_dwell_time": 145.3,
                "avg_flight_time": 89.2,
                "backspace_frequency": 0.12
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Reading pattern analysis endpoint
@app.post("/api/ml/reading/analyze", response_model=ReadingResponse)
async def analyze_reading(data: ReadingRequest):
    """
    Analyze reading behavior metrics
    """
    try:
        # TODO: Map to eye-tracking features, run classifier
        return ReadingResponse(
            risk_score=0.58,
            reading_difficulty_score=0.62,
            features={
                "regression_ratio": 0.25,
                "avg_fixation_duration": 312.5,
                "reading_speed": 85.3
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Fusion endpoint - combines all three modules
@app.post("/api/ml/fusion/calculate")
async def calculate_fusion_score(
    handwriting_score: float,
    keystroke_score: float,
    reading_score: float
):
    """
    Combine individual module scores into final risk assessment
    """
    try:
        # Weighted fusion (to be refined)
        weights = {"handwriting": 0.4, "keystroke": 0.3, "reading": 0.3}
        
        final_score = (
            handwriting_score * weights["handwriting"] +
            keystroke_score * weights["keystroke"] +
            reading_score * weights["reading"]
        )
        
        # Classify risk level
        if final_score < 0.3:
            risk_level = "Low"
        elif final_score < 0.6:
            risk_level = "Medium"
        else:
            risk_level = "High"
        
        return {
            "final_risk_score": round(final_score, 2),
            "risk_level": risk_level,
            "individual_scores": {
                "handwriting": handwriting_score,
                "keystroke": keystroke_score,
                "reading": reading_score
            },
            "confidence": 0.82
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
