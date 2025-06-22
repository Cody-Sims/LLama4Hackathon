#!/usr/bin/env python
import argparse, subprocess, tempfile, os, sys
from faster_whisper import WhisperModel

def extract_audio(video_path, tmp_dir):
    wav_path = os.path.join(tmp_dir, "audio.wav")
    subprocess.run(
        ["ffmpeg", "-i", video_path, "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1", wav_path, "-y"],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return wav_path

def load_model(name):
    return WhisperModel(name, device="cpu", compute_type="int8", cpu_threads=os.cpu_count())

_MODEL_CACHE = {}

def transcribe(audio_path, model_name):
    model = _MODEL_CACHE.get(model_name)
    if model is None:
        model = load_model(model_name)
        _MODEL_CACHE[model_name] = model
    segments, _ = model.transcribe(
        audio_path,                       # ndarray OR path
        beam_size=1,
        best_of=1,
        patience=1,
        temperature=0.0,
        condition_on_previous_text=False,
        language="en",
    )
    return " ".join(s.text.strip() for s in segments)

def main():
    p = argparse.ArgumentParser(description="Transcribe speech in a video file.")
    p.add_argument("video")
    p.add_argument("--out", "-o")
    p.add_argument("--model", "-m", default="tiny.en")
    args = p.parse_args()
    if not os.path.isfile(args.video):
        sys.exit("Input file not found.")
    with tempfile.TemporaryDirectory() as tmp:
        wav = extract_audio(args.video, tmp)
        text = transcribe(wav, args.model)
    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            f.write(text + "\n")
        print(f"✅ Transcript written to {args.out}")
    else:
        print(text)

if __name__ == "__main__":
    main()