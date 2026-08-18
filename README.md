
# Multimodal Dyslexia Risk Screening System

## 🎯 Project Overview

A multimodal, explainable AI-based dyslexia risk screening platform delivered as a full-stack web application. The system analyzes four behavioral and cognitive domains associated with dyslexia:

- **Handwriting** — letter reversal detection via OCR-based sentence comparison
- **Reading behavior** — speed, pauses, revisits, and comprehension tracked via browser interaction
- **Keystroke dynamics** — typing rhythm and anomaly detection
- **Memory** — sequence recall and word recall sub-tests

Combined with:
- **Explainable AI (XAI)** — SHAP-based feature attribution, natural language narratives, threshold breakdowns, and weighted contribution charts
- **Multimodal fusion** — module scores combined into a unified overall risk score with confidence estimation
- **Longitudinal progress tracking** — assessment history, trend charts, and downloadable PDF reports

The system is positioned as a **screening and decision-support tool**, not a clinical diagnostic instrument.

---

## 📊 Datasets and Calibration Sources

### Handwriting Module
- **Kaggle Handwritten Letters Dataset** — used as reference for reversal pair mapping (b/d, p/q, n/u, m/w, s/z)
- **Google Vision API** — production OCR engine for handwriting transcription
- Two YOLO model variants (99.5% and 99.4% mAP@50) were trained on synthetic word images during development but were **not used in production** due to poor generalization on real handwriting samples; OCR-based comparison was adopted instead

### Reading Module
- **ETDD70 Dataset** (Sedmidubsky et al., 2024) — used to calibrate behavioral thresholds for reading speed, pause frequency, pause duration, revisit count, and comprehension accuracy
- Note: the system does **not** use hardware eye-tracking; ETDD70's population-level norms are used to calibrate passive, browser-based behavioral proxies instead

### Keystroke Module
- **Aalto University Keystroke Dataset** (136M keystrokes) — used to train the Isolation Forest anomaly detection model and calibrate rule-based thresholds

### Memory Module
- Rule-based scoring only; no external dataset required

---

## 🏗️ Architecture

```
├── frontend/              # React + Vite web application
├── backend/                # Node.js + Express API
│   ├── src/routes/         # handwriting, reading, keystroke, memory, assessment, auth
│   ├── src/models/         # Mongoose schemas
│   ├── src/ml/keystroke/   # Isolation Forest inference + SHAP (Python subprocess)
│   ├── src/utils/          # explainabilityEngine.js, pdfGenerator.js
│   └── config/              # keystrokeConfig_Aalto.js, readingThresholds.js
├── ml-models/               # FastAPI ML microservice
│   ├── handwriting/         # OCR service, sentence comparator, risk calculator
│   └── main.py               # FastAPI server
└── docker-compose.yml
```

**Three-tier architecture:** React frontend (port 3000) → Node.js/Express backend (port 5000) → FastAPI ML service (port 8000, handwriting only). Keystroke inference runs via Python subprocess spawned directly by the backend.

---

## 🚀 Tech Stack

### Frontend
- React + Vite
- Material UI (MUI) + Tailwind CSS
- Recharts (radar chart, progress line chart, weighted contribution chart)
- `@react-oauth/google` for Google Sign-In

### Backend
- Node.js + Express.js
- MongoDB + Mongoose (ODM)
- JWT authentication + Google OAuth 2.0 (`google-auth-library`)
- Puppeteer (server-side PDF report generation)
- Multer (handwriting image upload handling)

### ML / AI
- **FastAPI** — handwriting OCR pipeline microservice
- **Google Vision API** — handwriting OCR
- **Isolation Forest** (scikit-learn) — keystroke anomaly detection
- **SHAP** (TreeExplainer) — keystroke feature-level explainability
- **NumPy / Pandas** — feature extraction and preprocessing

### Database
- MongoDB — users, assessments, and per-module result collections

### DevOps
- Docker + Docker Compose (frontend, backend, ML API, MongoDB)
- Deployed on AWS

---

## 📦 Installation

### Prerequisites
- Node.js (v18+)
- Python (3.11+)
- MongoDB
- Docker (optional, for containerized setup)
- Google Cloud Vision API credentials

### Setup Instructions

1. **Clone the repository**
```bash
git clone https://github.com/ShehrozAhmad05/dyslexia-detection-system.git
cd dyslexia-detection-system
```

2. **Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
# Configure your .env file (see Configuration section below)
npm run dev
```

3. **Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

4. **ML Service Setup**
```bash
cd ml-models
python -m venv .venv
.venv\Scripts\activate    # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

5. **Or run everything with Docker**
```bash
docker-compose up --build
```

---

## 🔧 Configuration

**Backend `.env`:**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/dyslexia_db
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
ML_API_URL=http://localhost:8000
PYTHON_PATH=/path/to/.venv/Scripts/python.exe
```

**Frontend `.env`:**
```
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

**ML Service `.env`:**
```
GOOGLE_APPLICATION_CREDENTIALS=ml-models/credentials/google_vision_key.json
```

---

## 📖 Usage

1. **Register or sign in** via email/password or Google OAuth
2. **Start an assessment** — proceeds sequentially through all four modules:
   - Handwriting: photograph a handwritten screening sentence
   - Reading: read a 3-section passage and answer comprehension questions
   - Keystroke: complete a standardized typing task
   - Memory: complete sequence recall and word recall sub-tests
3. **View results**:
   - Individual module scores with feature-level breakdowns
   - Overall fused risk score (Low / Moderate / High) with confidence
   - Multi-level explainability: SHAP charts, natural language narratives, threshold tables
4. **Track progress** via dashboard — radar chart, progress-over-time chart, assessment history
5. **Download PDF report** for any completed assessment

---

## 📊 Module Scoring Overview

| Module | Method | Key Reference |
|---|---|---|
| Handwriting | OCR + Levenshtein alignment + reversal-weighted scoring | Brooks et al. (2011), Isa et al. (2019) |
| Reading | Threshold-based scoring on 5 behavioral features | ETDD70 (Sedmidubsky et al., 2024) |
| Keystroke | Isolation Forest (60%) + rule-based thresholds (40%) + SHAP | Aalto Keystroke Dataset |
| Memory | Rule-based scoring across 4 risk dimensions | — |
| Fusion | Equal-weighted average (25% per module) | — |

---

## 🧪 Testing

Fifteen structured functional test cases were executed covering authentication, the full assessment lifecycle, all four module pipelines, fusion, explainability, and PDF generation. See `docs/testing.md` for the complete test case documentation.

---

## 🤝 Contributing

This is a Final Year Project (FYP). For collaboration inquiries, please contact the project authors.

---

## 📄 License

This project is developed as part of academic research at UET Lahore. All rights reserved.

---

## 👨‍💻 Team

**Shehroz Ahmad**, **Fatima Safdar**, **Laiba Sehar**   
Department of Computer Science, University of Engineering and Technology (UET), Lahore   
Supervised by **Mr. Nazeef ul Haq**  
Academic Year: 2025–2026

---

## 📚 Citations

If you use the datasets or reference this work, please cite:

- **ETDD70**: Sedmidubsky, J. et al. (2024) — Eye-Tracking Dataset for Dyslexia Detection
- **Aalto Keystroke Dataset**: Dhakal, V., Feit, A. M., Kristensson, P. O., & Oulasvirta, A. (2018) — *Observations on typing from 136 million keystrokes*, CHI 2018
- **Kaggle Handwritten Letters Dataset**

---

## 🔮 Future Work

- [ ] Formal clinical validation study
- [ ] Urdu and multilingual support
- [ ] Gamified therapy and intervention module
- [ ] Supervised keystroke models with clinically labeled data
- [ ] Teacher/institution-facing dashboard
- [ ] Locally calibrated datasets (Pakistan school-age population)
- [ ] Native mobile application (iOS/Android)
- [ ] Integration with school management systems

---
