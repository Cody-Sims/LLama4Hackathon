#!/usr/bin/env python
"""
video_to_text.py  –  Transcribe the speech in a video with OpenAI Whisper.

Usage
-----
python video_to_text.py  input_video.mp4  --out transcript.txt
"""

import argparse
import subprocess
import tempfile
import os
import sys
import whisper

def extract_audio(video_path: str, tmp_dir: str) -> str:
    """Convert video → 16-kHz mono WAV so Whisper can read it quickly."""
    wav_path = os.path.join(tmp_dir, "audio.wav")
    cmd = [
        "ffmpeg",
        "-i", video_path,          # input video
        "-vn",                     # no video
        "-acodec", "pcm_s16le",    # 16-bit PCM
        "-ar", "16000",            # 16 kHz
        "-ac", "1",                # mono
        wav_path,
        "-y"                       # overwrite silently
    ]
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL,
                       stderr=subprocess.DEVNULL)
    except subprocess.CalledProcessError:
        sys.exit("❌ FFmpeg failed – is it installed and on your $PATH?")
    return wav_path


def transcribe(audio_path: str, model_size: str = "small") -> str:
    """Run Whisper and return a single block of text (chronological)."""
    model = whisper.load_model(model_size, device="cpu")
    result = model.transcribe(
        audio_path,
        fp16=False,        # CPUs do not support FP16 :contentReference[oaicite:0]{index=0}
        verbose=False
    )
    # result["segments"] is ordered already, just join texts:
    transcript = " ".join(seg["text"].strip() for seg in result["segments"])
    return transcript


def main():
    parser = argparse.ArgumentParser(
        description="Transcribe the speech contained in a video file.")
    parser.add_argument("video", help=".mp4 or .mov source video")
    parser.add_argument("--out", "-o", help="Path to save transcript (txt)")
    parser.add_argument("--model", "-m", default="small",
                        help="Whisper model size "
                             "(tiny, base, small, medium, large)")
    args = parser.parse_args()

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
