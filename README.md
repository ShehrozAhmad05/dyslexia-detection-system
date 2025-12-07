# Multimodal AI System for Dyslexia Detection & Support

## 🎯 Project Overview

An AI-powered multimodal dyslexia detection system that analyzes:
- **Handwriting** (letter reversals, spacing, stroke patterns)
- **Keystroke dynamics** (typing behavior, timing patterns)
- **Reading patterns** (simulated eye-tracking through web-based tests)

Combined with:
- **Explainable AI (XAI)** - SHAP, LIME, Grad-CAM
- **Personalized therapy modules** for continuous learning support

## 📊 Datasets

### Handwriting Module
- **Roboflow Dyslexia Dataset**: 19,862 character-level images (A-Z)
- **Synthetic Handwriting (YOLO)**: 2,739 images with reversal labels
- **Dysgraphia Dataset**: 249 Malaysian handwriting samples

### Eye-Tracking Module
- **ETDD70 Dataset**: 70 subjects (35 dyslexic, 35 non-dyslexic)
- 210 recordings across 3 reading tasks
- High-frequency (250 Hz) fixation, saccade, and metrics data

### Keystroke Module
- **CMU DSL Dataset**: 20,400 keystroke records from 51 subjects
- Used for anomaly detection of dyslexic typing patterns

## 🏗️ Architecture

```
├── frontend/          # React.js web application
├── backend/           # Node.js + Express API
├── ml-models/         # Python ML/DL models
│   ├── handwriting/   # CNN, YOLO for handwriting analysis
│   ├── keystroke/     # Anomaly detection for typing patterns
│   ├── eye-tracking/  # Reading behavior analysis
│   ├── fusion/        # Multimodal risk score fusion
│   └── xai/           # Explainable AI (SHAP, LIME, Grad-CAM)
├── data/              # Dataset storage and processing
└── docs/              # Documentation
```

## 🚀 Tech Stack

### Frontend
- React.js
- Material-UI / Tailwind CSS
- Axios for API calls
- Chart.js for visualizations

### Backend
- Node.js + Express.js
- MongoDB (Mongoose)
- JWT Authentication
- Python integration for ML inference

### ML/AI
- **Frameworks**: TensorFlow, PyTorch, scikit-learn
- **Models**: YOLOv8, ResNet, MobileNet, LSTM
- **XAI**: SHAP, LIME, Grad-CAM
- **Libraries**: OpenCV, pandas, numpy

### Database
- MongoDB - User data, test results, progress tracking

## 📦 Installation

### Prerequisites
- Node.js (v18+)
- Python (3.9+)
- MongoDB
- Git

### Setup Instructions

1. **Clone the repository**
```bash
git clone https://github.com/your-username/dyslexia-detection-system.git
cd dyslexia-detection-system
```

2. **Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
# Configure your .env file
npm run dev
```

3. **Frontend Setup**
```bash
cd frontend
npm install
npm start
```

4. **ML Models Setup**
```bash
cd ml-models
pip install -r requirements.txt
```

## 🔧 Configuration

Create `.env` files in backend and frontend directories:

**Backend `.env`:**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/dyslexia_db
JWT_SECRET=your_jwt_secret
ML_API_URL=http://localhost:8000
```

**Frontend `.env`:**
```
REACT_APP_API_URL=http://localhost:5000/api
```

## 📖 Usage

1. **User Registration/Login**
2. **Complete Assessment Tests**:
   - Upload handwriting samples
   - Complete typing test
   - Complete reading comprehension test
3. **View Results**:
   - Individual module scores
   - Combined risk assessment
   - XAI explanations
4. **Access Therapy Modules** based on assessment results

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# ML model tests
cd ml-models
pytest tests/
```

## 📊 Model Performance

| Module | Accuracy | Dataset Size |
|--------|----------|--------------|
| Handwriting | 88-93% | 22,000+ images |
| Eye-Tracking | 85-90% | 210 recordings |
| Keystroke | Anomaly-based | 20,400 records |

## 🤝 Contributing

This is a Final Year Project (FYP). For collaboration inquiries, please contact the project author.

## 📄 License

This project is developed as part of academic research. All rights reserved.

## 👨‍💻 Author

[Your Name]  
[Your University]  
Academic Year: 2024-2025

## 📚 Citations

If you use the datasets, please cite:
- ETDD70: Dostalova et al. (2024) - Zenodo
- Roboflow Dyslexia Dataset
- CMU Keystroke Dynamics Dataset

## 🔮 Future Enhancements

- [ ] Mobile app development
- [ ] Real-time webcam eye-tracking
- [ ] Multi-language support
- [ ] Advanced therapy gamification
- [ ] Teacher/parent dashboard

## 📞 Contact

For questions or feedback, reach out at: [your.email@university.edu]
