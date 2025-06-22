#!/usr/bin/env python3
"""
Quick verification script for Python environment
Run this after setup to verify everything is working
"""
import sys
import os
import subprocess

def check_command(cmd, description):
    """Check if a command is available"""
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        print(f"✅ {description}: Available")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print(f"❌ {description}: Not available")
        return False

def check_python_package(package, description=""):
    """Check if a Python package is importable"""
    try:
        __import__(package)
        print(f"✅ {package} {description}: Installed")
        return True
    except ImportError:
        print(f"❌ {package} {description}: Not installed")
        return False

def main():
    print("🔍 Quick Environment Verification")
    print("=" * 40)
    
    # Check Python version
    python_version = sys.version_info
    print(f"Python version: {python_version.major}.{python_version.minor}.{python_version.micro}")
    
    if python_version < (3, 8):
        print("❌ Python 3.8+ required")
        return False
    else:
        print("✅ Python version is compatible")
    
    print("\n🔧 System Dependencies:")
    print("-" * 25)
    
    # Check system dependencies
    system_ok = True
    system_ok &= check_command(['ffmpeg', '-version'], 'FFmpeg')
    system_ok &= check_command(['python3', '--version'], 'Python3')
    system_ok &= check_command(['pip3', '--version'], 'pip3')
    
    print("\n📦 Python Packages:")
    print("-" * 20)
    
    # Check critical packages
    packages_ok = True
    packages_ok &= check_python_package('whisper', '(audio transcription)')
    packages_ok &= check_python_package('torch', '(PyTorch)')
    packages_ok &= check_python_package('numpy', '(numerical computing)')
    packages_ok &= check_python_package('cv2', '(OpenCV)')
    
    print("\n🔧 Optional Packages:")
    print("-" * 22)
    
    # Check optional packages
    check_python_package('faster_whisper', '(faster transcription)')
    check_python_package('fastapi', '(API framework)')
    check_python_package('uvicorn', '(ASGI server)')
    check_python_package('librosa', '(audio processing)')
    
    print("\n📁 Project Structure:")
    print("-" * 21)
    
    # Check project files
    project_root = os.path.dirname(os.path.abspath(__file__))
    structure_ok = True
    
    required_paths = [
        ('transcribe/transcribe_cpp.py', 'Transcription script'),
        ('video-description-app/backend.js', 'Backend server'),
        ('venv/bin/python', 'Virtual environment'),
    ]
    
    for path, description in required_paths:
        full_path = os.path.join(project_root, path)
        if os.path.exists(full_path):
            print(f"✅ {description}: Found")
        else:
            print(f"❌ {description}: Missing at {path}")
            structure_ok = False
    
    print("\n" + "=" * 40)
    
    if system_ok and packages_ok and structure_ok:
        print("🎉 Environment verification PASSED!")
        print("Your environment is ready for the video description app.")
        return True
    else:
        print("❌ Environment verification FAILED!")
        print("Please run ./setup_python_env.sh to fix issues.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
