# GitHub Repository Setup Guide

## 📋 Steps to Create and Push to GitHub

### 1. Create Repository on GitHub

1. Go to [GitHub](https://github.com)
2. Click the **"+"** icon (top right) → **"New repository"**
3. Fill in repository details:
   - **Repository name**: `dyslexia-detection-system`
   - **Description**: "Multimodal AI System for Dyslexia Detection & Support - FYP 2024-25"
   - **Visibility**: 
     - ✅ **Private** (recommended for FYP until completion)
     - OR Public (if you want to share)
   - **DO NOT** initialize with README (we already have one)
4. Click **"Create repository"**

### 2. Link Local Repository to GitHub

```bash
# Navigate to project directory
cd d:\FYP\Code\dyslexia-detection-system

# Add remote origin (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/dyslexia-detection-system.git

# Verify remote was added
git remote -v

# Push to GitHub
git push -u origin master
```

### 3. Alternative: Using SSH (More Secure)

If you have SSH keys set up:

```bash
git remote add origin git@github.com:YOUR_USERNAME/dyslexia-detection-system.git
git push -u origin master
```

---

## 🔐 Setting Up SSH Keys (Recommended)

### Generate SSH Key

```bash
# Generate new SSH key
ssh-keygen -t ed25519 -C "your.email@example.com"

# Windows: Default location: C:\Users\YourName\.ssh\id_ed25519
# Press Enter to accept default location
# Enter passphrase (optional but recommended)

# Start SSH agent
# Windows (PowerShell as Admin):
Start-Service ssh-agent
ssh-add C:\Users\YourName\.ssh\id_ed25519
```

### Add SSH Key to GitHub

1. Copy public key:
```bash
# Windows PowerShell:
Get-Content C:\Users\YourName\.ssh\id_ed25519.pub | Set-Clipboard

# Or manually open file and copy:
notepad C:\Users\YourName\.ssh\id_ed25519.pub
```

2. Go to GitHub → Settings → SSH and GPG keys → New SSH key
3. Paste your public key
4. Click "Add SSH key"

---

## 📊 Repository Organization

### Recommended Branches

```bash
# Main branch (stable, production-ready)
master (or main)

# Development branch
git checkout -b develop

# Feature branches
git checkout -b feature/handwriting-module
git checkout -b feature/keystroke-module
git checkout -b feature/eye-tracking-module

# Bugfix branches
git checkout -b bugfix/login-error
```

### Branch Strategy

```
master/main          ← Production-ready code
    ↑
  develop            ← Integration branch
    ↑
  feature/*          ← Individual features
  bugfix/*           ← Bug fixes
```

---

## 🏷️ Adding Tags for Milestones

```bash
# Tag important milestones
git tag -a v0.1.0 -m "Initial project setup"
git tag -a v0.2.0 -m "Handwriting module completed"
git tag -a v0.3.0 -m "All modules integrated"
git tag -a v1.0.0 -m "FYP submission version"

# Push tags to GitHub
git push origin --tags
```

---

## 📝 Good Commit Message Practices

```bash
# Format: <type>: <subject>

# Types:
feat:     # New feature
fix:      # Bug fix
docs:     # Documentation changes
style:    # Formatting, no code change
refactor: # Code refactoring
test:     # Adding tests
chore:    # Maintenance tasks

# Examples:
git commit -m "feat: Add handwriting upload component"
git commit -m "fix: Resolve MongoDB connection timeout"
git commit -m "docs: Update API documentation"
git commit -m "refactor: Optimize image preprocessing pipeline"
```

---

## 🔄 Daily Git Workflow

```bash
# Morning: Pull latest changes
git pull origin develop

# Create feature branch
git checkout -b feature/new-feature

# Make changes...
git add .
git commit -m "feat: Implement new feature"

# Push your branch
git push origin feature/new-feature

# On GitHub: Create Pull Request to merge into develop
```

---

## 🚨 Important: What NOT to Commit

Already configured in `.gitignore`, but double-check:

❌ **Never commit:**
- `.env` files (secrets, API keys)
- `node_modules/` folder
- Large datasets (`data/raw/*`)
- Trained model weights (use Git LFS for these)
- Personal credentials
- Database dumps

✅ **DO commit:**
- `.env.example` (template without secrets)
- Source code
- Documentation
- Small test datasets
- Configuration files
- README, package.json, requirements.txt

---

## 🎯 Using Git LFS for Large Files

For trained model files (optional):

```bash
# Install Git LFS
# Download from: https://git-lfs.github.com/

# Initialize Git LFS
git lfs install

# Track large files
git lfs track "*.h5"          # TensorFlow models
git lfs track "*.pth"         # PyTorch models
git lfs track "*.pkl"         # Pickled models
git lfs track "*.onnx"        # ONNX models

# Add .gitattributes
git add .gitattributes

# Commit and push as normal
git commit -m "Add trained models with Git LFS"
git push
```

---

## 📂 Repository Structure on GitHub

After pushing, your GitHub repo will have:

```
dyslexia-detection-system/
├── 📁 frontend/
├── 📁 backend/
├── 📁 ml-models/
├── 📁 data/          (with .gitkeep files only)
├── 📁 docs/
├── 📁 tests/
├── 📄 README.md
├── 📄 .gitignore
└── 📄 LICENSE (optional)
```

---

## 🛡️ Adding Collaborators (Optional)

If working with team members:

1. Go to repository on GitHub
2. Settings → Collaborators
3. Add collaborators by username/email
4. They'll receive invitation

---

## 📊 GitHub Features to Use

### 1. Issues
Track bugs, features, todos:
- Go to "Issues" tab
- Create issue templates
- Label issues (bug, enhancement, documentation)

### 2. Projects
Use GitHub Projects for task management:
- Kanban board view
- Todo, In Progress, Done columns

### 3. Wiki (Optional)
Document your project:
- Architecture decisions
- API specifications
- Development guidelines

### 4. Releases
Create releases for milestones:
- Attach compiled binaries
- Write changelog
- Tag versions

---

## 🔄 Keeping Fork Updated (If Forking)

If you fork from a template:

```bash
# Add upstream remote
git remote add upstream https://github.com/original-repo/template.git

# Fetch upstream changes
git fetch upstream

# Merge into your branch
git merge upstream/main
```

---

## 📈 Next Steps After GitHub Setup

1. ✅ Push initial commit (already done)
2. ⬜ Add detailed README with badges
3. ⬜ Set up CI/CD (GitHub Actions)
4. ⬜ Add issue templates
5. ⬜ Create development roadmap
6. ⬜ Invite supervisor as collaborator (if required)
7. ⬜ Enable GitHub Pages for documentation (optional)

---

## 🚀 Quick Reference

```bash
# Clone
git clone https://github.com/USERNAME/dyslexia-detection-system.git

# Status
git status

# Add files
git add .
git add <specific-file>

# Commit
git commit -m "message"

# Push
git push origin <branch-name>

# Pull
git pull origin <branch-name>

# Create branch
git checkout -b <branch-name>

# Switch branch
git checkout <branch-name>

# View branches
git branch -a

# Delete branch
git branch -d <branch-name>
```

---

## ✅ Verification Checklist

After pushing to GitHub, verify:

- [ ] All files visible on GitHub
- [ ] .gitignore working (node_modules not uploaded)
- [ ] README.md displays correctly
- [ ] Repository is private/public as intended
- [ ] Collaborators added (if any)
- [ ] Branch protection rules set (optional)
