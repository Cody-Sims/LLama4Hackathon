#!/usr/bin/env python3
import argparse, subprocess, os, sys

BIN   = os.environ.get("WHISPER_BIN", "whisper-cli")
MODEL = os.path.expanduser("~/.cache/whispercpp/ggml-tiny.bin")

def stream_cpp(src, lang, threads):
    ffmpeg = subprocess.Popen(
        [
            "ffmpeg", "-loglevel", "error", "-i", src, "-vn",
            "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1",
            "-f", "wav", "-"                       # <-- WAV container
        ],
        stdout=subprocess.PIPE
    )
    cpp = subprocess.run(
        [
            BIN, "-m", MODEL, "-f", "-",
            "-l", lang, "-bs", "1", "-t", str(threads),
            "-nt", "-np"                           # no-timestamps, no progress
        ],
        stdin=ffmpeg.stdout,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=True
    )
    ffmpeg.stdout.close()
    ffmpeg.wait()
    return cpp.stdout.decode().strip()

def main():
    p = argparse.ArgumentParser()
    p.add_argument("video")
    p.add_argument("--out", "-o")
    p.add_argument("--lang", "-l", default="auto")
    p.add_argument("--threads", "-t", type=int, default=min(os.cpu_count(), 8))
    a = p.parse_args()

    if not os.path.isfile(a.video):
        sys.exit("Input file not found.")

    text = stream_cpp(a.video, a.lang, a.threads)

    if a.out:
        with open(a.out, "w", encoding="utf-8") as f:
            f.write(text + "\n")
        print(f"✅ Transcript written to {a.out}")
    else:
        print(text)

if __name__ == "__main__":
    main()
