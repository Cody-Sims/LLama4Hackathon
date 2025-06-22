#!/bin/bash

# Video Description App - Python Environment Setup Script
# This script ensures the Python virtual environment is properly set up with all required packages

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
VENV_PATH="$PROJECT_ROOT/venv"

print_status "Starting Python environment setup for Video Description App"
print_status "Project root: $PROJECT_ROOT"

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3.8 or later."
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
print_success "Found Python $PYTHON_VERSION"

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    print_error "pip3 is not installed. Please install pip3."
    exit 1
fi

print_success "Found pip3"

# Check if FFmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    print_warning "FFmpeg is not installed. Installing via Homebrew..."
    if command -v brew &> /dev/null; then
        brew install ffmpeg
        print_success "FFmpeg installed successfully"
    else
        print_error "Homebrew is not installed. Please install FFmpeg manually:"
        print_error "  brew install ffmpeg"
        print_error "  or visit: https://ffmpeg.org/download.html"
        exit 1
    fi
else
    print_success "FFmpeg is already installed"
fi

# Create or activate virtual environment
if [ -d "$VENV_PATH" ]; then
    print_status "Virtual environment already exists at $VENV_PATH"
    print_status "Checking if it's working properly..."
    
    # Test if the virtual environment is working
    if "$VENV_PATH/bin/python" --version &> /dev/null; then
        print_success "Virtual environment is working"
    else
        print_warning "Virtual environment seems corrupted. Recreating..."
        rm -rf "$VENV_PATH"
    fi
fi

if [ ! -d "$VENV_PATH" ]; then
    print_status "Creating new virtual environment..."
    python3 -m venv "$VENV_PATH"
    print_success "Virtual environment created at $VENV_PATH"
fi

# Activate virtual environment
print_status "Activating virtual environment..."
source "$VENV_PATH/bin/activate"

# Upgrade pip
print_status "Upgrading pip..."
pip install --upgrade pip

# Install requirements
REQUIREMENTS_FILE="$PROJECT_ROOT/requirements.txt"
if [ -f "$REQUIREMENTS_FILE" ]; then
    print_status "Installing packages from requirements.txt..."
    pip install -r "$REQUIREMENTS_FILE"
    print_success "All packages installed successfully"
else
    print_warning "requirements.txt not found. Installing core packages manually..."
    
    # Install core packages
    print_status "Installing core transcription packages..."
    pip install openai-whisper torch faster-whisper
    
    print_status "Installing FastAPI and related packages..."
    pip install fastapi uvicorn requests logzero opencv-python
    
    print_status "Installing additional dependencies..."
    pip install numpy Pillow scipy librosa soundfile ffmpeg-python
    
    print_success "Core packages installed"
fi

# Verify installations
print_status "Verifying package installations..."

# Check Whisper
if python -c "import whisper; print('Whisper version:', whisper.__version__)" 2>/dev/null; then
    print_success "✅ Whisper is properly installed"
else
    print_error "❌ Whisper installation failed"
fi

# Check torch
if python -c "import torch; print('PyTorch version:', torch.__version__)" 2>/dev/null; then
    print_success "✅ PyTorch is properly installed"
else
    print_error "❌ PyTorch installation failed"
fi

# Check faster-whisper
if python -c "import faster_whisper; print('Faster-Whisper is installed')" 2>/dev/null; then
    print_success "✅ Faster-Whisper is properly installed"
else
    print_warning "⚠️ Faster-Whisper not found (optional)"
fi

# Check FastAPI
if python -c "import fastapi; print('FastAPI version:', fastapi.__version__)" 2>/dev/null; then
    print_success "✅ FastAPI is properly installed"
else
    print_warning "⚠️ FastAPI not found (needed for inference API)"
fi

# Check OpenCV
if python -c "import cv2; print('OpenCV version:', cv2.__version__)" 2>/dev/null; then
    print_success "✅ OpenCV is properly installed"
else
    print_warning "⚠️ OpenCV not found (needed for video processing)"
fi

# Test the transcription script
TRANSCRIBE_SCRIPT="$PROJECT_ROOT/transcribe/transcribe_cpp.py"
if [ -f "$TRANSCRIBE_SCRIPT" ]; then
    print_status "Testing transcription script..."
    if python "$TRANSCRIBE_SCRIPT" --help &> /dev/null; then
        print_success "✅ Transcription script is working"
    else
        print_warning "⚠️ Transcription script test failed (may need audio file to test properly)"
    fi
else
    print_warning "⚠️ Transcription script not found at $TRANSCRIBE_SCRIPT"
fi

# Create a simple test script to verify everything works
TEST_SCRIPT="$PROJECT_ROOT/test_python_setup.py"
cat > "$TEST_SCRIPT" << 'EOF'
#!/usr/bin/env python3
"""
Test script to verify Python environment setup
"""
import sys
import importlib

def test_import(module_name, description=""):
    try:
        module = importlib.import_module(module_name)
        print(f"✅ {module_name} - OK {description}")
        return True
    except ImportError as e:
        print(f"❌ {module_name} - FAILED: {e}")
        return False

def main():
    print("Testing Python environment setup...")
    print(f"Python version: {sys.version}")
    print(f"Python executable: {sys.executable}")
    print()
    
    required_modules = [
        ("whisper", "(for audio transcription)"),
        ("torch", "(PyTorch for ML)"),
        ("numpy", "(numerical computing)"),
        ("cv2", "(OpenCV for video processing)"),
    ]
    
    optional_modules = [
        ("faster_whisper", "(faster transcription - optional)"),
        ("fastapi", "(for inference API - optional)"),
        ("uvicorn", "(for serving API - optional)"),
        ("librosa", "(audio processing - optional)"),
        ("soundfile", "(audio I/O - optional)"),
    ]
    
    print("Required modules:")
    required_ok = all(test_import(module, desc) for module, desc in required_modules)
    
    print("\nOptional modules:")
    for module, desc in optional_modules:
        test_import(module, desc)
    
    print()
    if required_ok:
        print("🎉 All required modules are installed! Environment setup is complete.")
        return 0
    else:
        print("❌ Some required modules are missing. Please check the installation.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
EOF

# Make the test script executable
chmod +x "$TEST_SCRIPT"

# Run the test
print_status "Running comprehensive environment test..."
python "$TEST_SCRIPT"
TEST_RESULT=$?

# Clean up test script
rm "$TEST_SCRIPT"

# Create activation helper script
ACTIVATE_SCRIPT="$PROJECT_ROOT/activate_env.sh"
cat > "$ACTIVATE_SCRIPT" << EOF
#!/bin/bash
# Helper script to activate the Python virtual environment
# Usage: source ./activate_env.sh

SCRIPT_DIR="\$(cd "\$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
VENV_PATH="\$SCRIPT_DIR/venv"

if [ -d "\$VENV_PATH" ]; then
    source "\$VENV_PATH/bin/activate"
    echo "✅ Virtual environment activated"
    echo "Python: \$(which python)"
    echo "To deactivate, run: deactivate"
else
    echo "❌ Virtual environment not found at \$VENV_PATH"
    echo "Run ./setup_python_env.sh first"
    exit 1
fi
EOF

chmod +x "$ACTIVATE_SCRIPT"

print_success "Setup complete!"
print_status "📋 Summary:"
echo "  • Virtual environment: $VENV_PATH"
echo "  • Activation script: $ACTIVATE_SCRIPT"
echo "  • To activate manually: source $VENV_PATH/bin/activate"
echo "  • To activate with helper: source ./activate_env.sh"
echo ""
print_status "🚀 Next steps:"
echo "  1. Activate the environment: source ./activate_env.sh"
echo "  2. Test transcription: python transcribe/transcribe_cpp.py <video_file>"
echo "  3. Start the backend: cd video-description-app && node backend.js"

if [ $TEST_RESULT -eq 0 ]; then
    print_success "🎉 Environment setup completed successfully!"
    exit 0
else
    print_warning "⚠️ Environment setup completed with some issues. Check the test results above."
    exit 1
fi
