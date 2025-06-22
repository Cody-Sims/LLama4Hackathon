Commands to run:

brew install ffmpeg
python3 -m venv venv && source venv/bin/activate
pip install --upgrade openai-whisper torch

pip install faster-whisper

git clone https://github.com/ggerganov/whisper.cpp.git
cd whisper.cpp
make -j$(nproc)
sudo mv ./main /usr/local/bin/whisper-cli

curl -L \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin \
  -o ~/.cache/whispercpp/ggml-tiny.bin


python transcribe/transcribe_cpp.py  transcribe/Video_Clip_Generation_Complete.mp4