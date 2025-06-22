# Python Environment Setup

This directory contains scripts to ensure your Python environment is properly configured for the Video Description App.

## Quick Start

1. **Run the setup script:**
   ```bash
   ./setup_python_env.sh
   ```

2. **Verify the installation:**
   ```bash
   python3 verify_env.py
   ```

3. **Activate the environment:**
   ```bash
   source ./activate_env.sh
   ```

## What the Setup Script Does

The `setup_python_env.sh` script will:

- ✅ Check for Python 3.8+ installation
- ✅ Install FFmpeg via Homebrew (if needed)
- ✅ Create/verify virtual environment at `./venv/`
- ✅ Install all required Python packages:
  - `openai-whisper` - Audio transcription
  - `torch` - PyTorch for machine learning
  - `faster-whisper` - Faster transcription alternative
  - `fastapi` & `uvicorn` - API framework
  - `opencv-python` - Video processing
  - `numpy`, `scipy`, `librosa` - Scientific computing
- ✅ Test all installations
- ✅ Create helper scripts

## Files Created

- `requirements.txt` - Python package dependencies
- `setup_python_env.sh` - Main setup script
- `activate_env.sh` - Helper to activate virtual environment
- `verify_env.py` - Quick verification script

## Manual Setup (Alternative)

If the automated script doesn't work, you can set up manually:

```bash
# 1. Install system dependencies
brew install ffmpeg

# 2. Create virtual environment
python3 -m venv venv
source venv/bin/activate

# 3. Install packages
pip install --upgrade pip
pip install -r requirements.txt

# 4. Verify installation
python3 verify_env.py
```

## Troubleshooting

### Common Issues

1. **FFmpeg not found:**
   ```bash
   brew install ffmpeg
   ```

2. **Python version too old:**
   - Install Python 3.8+ via Homebrew: `brew install python@3.11`

3. **Virtual environment issues:**
   ```bash
   rm -rf venv
   ./setup_python_env.sh
   ```

4. **Package installation fails:**
   ```bash
   source venv/bin/activate
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

### Verification Checklist

Run `python3 verify_env.py` to check:
- ✅ Python 3.8+ installed
- ✅ FFmpeg available
- ✅ Virtual environment working
- ✅ All required packages installed
- ✅ Project files in correct locations

## Usage After Setup

1. **Start the backend server:**
   ```bash
   source ./activate_env.sh
   cd video-description-app
   node backend.js
   ```

2. **Test transcription directly:**
   ```bash
   source ./activate_env.sh
   python transcribe/transcribe_cpp.py path/to/video.mp4
   ```

3. **Run the inference API:**
   ```bash
   source ./activate_env.sh
   cd inference
   python app/main.py
   ```

## Environment Variables

Create a `.env` file in the `video-description-app/` directory if you need:
```bash
OPENAI_API_KEY=your_openai_key_here
LLAMA_API_URL=your_llama_api_url
```

## Package Versions

The setup installs these core packages:
- `openai-whisper>=20231117`
- `torch>=2.0.0`
- `faster-whisper>=0.9.0`
- `fastapi>=0.104.0`
- `opencv-python>=4.8.0`

For full list, see `requirements.txt`.
