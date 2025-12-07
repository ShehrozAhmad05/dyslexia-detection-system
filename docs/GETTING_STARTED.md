# Getting Started Guide

## 🚀 Initial Setup

### 1. Clone the Repository (After GitHub setup)
```bash
git clone https://github.com/YOUR_USERNAME/dyslexia-detection-system.git
cd dyslexia-detection-system
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your configuration
# nano .env  (or use any text editor)

# Start MongoDB (make sure it's running)
# Windows: Start MongoDB service
# Mac/Linux: mongod

# Run backend server
npm run dev
```

Backend will run on: `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm start
```

Frontend will run on: `http://localhost:3000`

### 4. ML Models Setup

```bash
cd ml-models

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start ML API server
python main.py
```

ML API will run on: `http://localhost:8000`

---

## 📂 Link Your Datasets

Since datasets are too large for Git, link them manually:

```bash
# Create symbolic links or copy datasets
# Windows (as Administrator):
mklink /D "data\raw\Eye_Dataset" "D:\FYP\Code\Eye_Dataset"
mklink /D "data\raw\Handwriting_data" "D:\FYP\Code\Handwriting_data"
mklink /D "data\raw\Keystrokes_Dataset" "D:\FYP\Code\Keystrokes_Dataset"

# Or simply copy folders:
xcopy "D:\FYP\Code\Eye_Dataset" "data\raw\Eye_Dataset" /E /I
xcopy "D:\FYP\Code\Handwriting_data" "data\raw\Handwriting_data" /E /I
xcopy "D:\FYP\Code\Keystrokes_Dataset" "data\raw\Keystrokes_Dataset" /E /I
```

---

## 🧪 Testing the Setup

### Test Backend
```bash
curl http://localhost:5000/api/health
# Expected: {"status":"ok","message":"Server is running"}
```

### Test ML API
```bash
curl http://localhost:8000/health
# Expected: {"status":"healthy","models_loaded":true}
```

### Test Frontend
Open browser: `http://localhost:3000`

---

## 📝 Development Workflow

### Creating a New Feature

1. **Create a new branch**
```bash
git checkout -b feature/handwriting-upload
```

2. **Make your changes**
```bash
# Edit files...
git add .
git commit -m "Add handwriting upload component"
```

3. **Push to GitHub**
```bash
git push origin feature/handwriting-upload
```

4. **Create Pull Request** on GitHub

### Daily Development

```bash
# Pull latest changes
git pull origin main

# Start all services
# Terminal 1: cd backend && npm run dev
# Terminal 2: cd frontend && npm start
# Terminal 3: cd ml-models && python main.py
```

---

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check MONGODB_URI in backend/.env
- Install MongoDB: https://www.mongodb.com/try/download/community

### Port Already in Use
```bash
# Windows - Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Change port in .env file
```

### Python Dependencies Error
```bash
# Upgrade pip
python -m pip install --upgrade pip

# Install with specific versions
pip install -r requirements.txt --no-cache-dir
```

### React Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 📦 Building for Production

### Frontend
```bash
cd frontend
npm run build
# Outputs to frontend/build/
```

### Backend
```bash
cd backend
# Set NODE_ENV=production in .env
npm start
```

---

## 🔑 Important Next Steps

1. **Database Setup**: Create MongoDB database and collections
2. **Authentication**: Implement user registration/login
3. **File Upload**: Configure multer for image uploads
4. **ML Training**: Train models on your datasets
5. **API Integration**: Connect frontend → backend → ML API
6. **Testing**: Write unit tests for critical components
7. **Documentation**: Update API docs as you build

---

## 📚 Useful Commands

```bash
# Backend
npm run dev          # Development mode with hot reload
npm start            # Production mode
npm test             # Run tests

# Frontend
npm start            # Development server
npm build            # Production build
npm test             # Run tests

# ML Models
python main.py       # Start API server
pytest tests/        # Run ML tests
jupyter notebook     # Open notebooks for exploration
```

---

## 🆘 Need Help?

- Check `/docs` folder for detailed documentation
- Review code comments
- Refer to README.md for overview
- Stack Overflow for specific technical issues
