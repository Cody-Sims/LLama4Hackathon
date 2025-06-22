#!/usr/bin/env python3
import argparse, subprocess, tempfile, os, sys

BIN   = os.environ.get("WHISPER_BIN", "whisper-cli")
MODEL = os.path.expanduser("~/.cache/whispercpp/ggml-tiny.bin")

def to_wav(src, tmp):
    out = os.path.join(tmp, "audio.wav")
    subprocess.run(
        ["ffmpeg", "-i", src, "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1", out, "-y"],
        check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )
    return out

def run_cpp(wav, lang, threads):
    pref = wav + "_out"
    cmd = [
        BIN, "-m", MODEL, "-f", wav,
        "-l", lang,            # "auto" or "en", "es", "fr", …
        "-bs", "1",            # greedy decode
        "-t", str(threads),
        "-otxt", "-of", pref, "-np"
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    with open(pref + ".txt", encoding="utf-8") as f:
        return f.read().strip()

def main():
    ap = argparse.ArgumentParser(description="Transcribe any-language video via whisper.cpp")
    ap.add_argument("video", help="input .mp4 / .mov")
    ap.add_argument("--out", "-o", help="output .txt")
    ap.add_argument("--lang", "-l", default="auto", help="'auto' or ISO 639-1 code (en, es, fr, …)")
    ap.add_argument("--threads", "-t", type=int, default=min(os.cpu_count(), 8))
    args = ap.parse_args()

    if not os.path.isfile(args.video):
        sys.exit("Input file not found.")

    with tempfile.TemporaryDirectory() as tmp:
        wav  = to_wav(args.video, tmp)
        text = run_cpp(wav, args.lang, args.threads)

    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            f.write(text + "\n")
        print(f"✅ Transcript written to {args.out}")
    else:
        print(text)

if __name__ == "__main__":
    main()