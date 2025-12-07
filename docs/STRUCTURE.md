# Project Structure

```
dyslexia-detection-system/
│
├── frontend/                      # React.js Application
│   ├── public/                    # Static assets
│   ├── src/
│   │   ├── components/            # Reusable React components
│   │   │   ├── Auth/             # Login, Register
│   │   │   ├── Dashboard/        # Main dashboard
│   │   │   ├── HandwritingModule/# Handwriting upload & analysis
│   │   │   ├── KeystrokeModule/  # Typing test interface
│   │   │   ├── ReadingModule/    # Reading comprehension test
│   │   │   ├── XAI/              # Explainability visualizations
│   │   │   └── Therapy/          # Therapy recommendations
│   │   ├── pages/                # Page components
│   │   ├── services/             # API calls (axios)
│   │   ├── utils/                # Helper functions
│   │   └── assets/               # Images, styles
│   └── package.json
│
├── backend/                       # Node.js + Express API
│   ├── src/
│   │   ├── routes/               # API route definitions
│   │   ├── controllers/          # Business logic
│   │   ├── models/               # MongoDB schemas (Mongoose)
│   │   ├── middleware/           # Auth, validation, error handling
│   │   ├── services/             # External service integrations
│   │   ├── utils/                # Helper functions
│   │   └── config/               # Configuration files
│   └── package.json
│
├── ml-models/                     # Python ML/DL Models
│   ├── handwriting/
│   │   ├── preprocessing/        # Image preprocessing scripts
│   │   ├── training/             # Model training scripts
│   │   │   ├── train_cnn.py     # ResNet/EfficientNet training
│   │   │   ├── train_yolo.py    # YOLOv8 reversal detection
│   │   │   └── train_dysgraphia.py
│   │   ├── inference/            # Model inference scripts
│   │   └── models/               # Model architecture definitions
│   │
│   ├── keystroke/
│   │   ├── preprocessing/        # Feature extraction
│   │   ├── training/             # Anomaly detection training
│   │   └── inference/
│   │
│   ├── eye-tracking/
│   │   ├── preprocessing/        # Metrics extraction
│   │   ├── training/             # Classifier training
│   │   └── inference/
│   │
│   ├── fusion/                   # Multimodal score fusion
│   ├── xai/                      # SHAP, LIME, Grad-CAM
│   ├── notebooks/                # Jupyter notebooks for exploration
│   ├── saved_models/             # Trained model weights
│   ├── logs/                     # Training logs
│   ├── main.py                   # FastAPI server
│   └── requirements.txt
│
├── data/                          # Data storage (gitignored)
│   ├── raw/                      # Original datasets
│   ├── processed/                # Preprocessed data
│   └── uploads/                  # User uploads
│
├── docs/                          # Documentation
│   ├── API.md                    # API documentation
│   ├── MODELS.md                 # Model architecture details
│   └── DEPLOYMENT.md             # Deployment guide
│
├── tests/                         # Test suites
│   ├── frontend/
│   ├── backend/
│   └── ml/
│
├── .gitignore
├── README.md
└── LICENSE
```

## Key Directories Explained

### Frontend (`/frontend`)
- React application for user interface
- Handles user interactions, data collection, results display
- Communicates with backend via REST API

### Backend (`/backend`)
- Node.js server managing business logic
- User authentication & authorization
- Database operations (MongoDB)
- Routes requests to ML API for predictions

### ML Models (`/ml-models`)
- Python-based machine learning pipeline
- FastAPI server for model inference
- Training scripts for all three modules
- XAI integration for explainability

### Data (`/data`)
- NOT committed to Git (too large)
- Stores datasets locally
- Processed data ready for training
- User-uploaded files during testing
