"""
FastAPI server for ML model inference
Handles requests from Node.js backend for dyslexia detection
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import numpy as np
from typing import Dict, List

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
class HandwritingResponse(BaseModel):
    risk_score: float
    features: Dict
    reversals_detected: int
    confidence: float

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

# Handwriting analysis endpoint
@app.post("/api/ml/handwriting/analyze", response_model=HandwritingResponse)
async def analyze_handwriting(file: UploadFile = File(...)):
    """
    Analyze handwriting image for dyslexia indicators
    """
    try:
        # TODO: Load image, preprocess, run through models
        # Placeholder response
        return HandwritingResponse(
            risk_score=0.65,
            features={
                "reversal_count": 3,
                "spacing_score": 0.7,
                "alignment_score": 0.6
            },
            reversals_detected=3,
            confidence=0.85
        )
    except Exception as e:
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
