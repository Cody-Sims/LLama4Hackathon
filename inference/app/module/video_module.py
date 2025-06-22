import os 
import cv2
from module.image_module import binary2base64
import base64
import io
import argparse, subprocess, tempfile, sys
from moviepy import VideoFileClip
from pathlib import Path

# env parameter
BIN   = os.environ.get("WHISPER_BIN", "whisper-cli")
MODEL = os.path.expanduser("/root/app/model/ggml-tiny.bin")

def base642video(base64_video:str, request_guid:str) -> list:
    # load video
    b64 = base64_video.split("data:video/mp4;base64,")[0]

    # 解碼並寫入
    Path(f"/root/app/data/video/{request_guid}.mp4").write_bytes(base64.b64decode(b64))

# split video and do video2text
def split_video_and_to_text(video_path:str, segment_length=8) -> list:
    clip = VideoFileClip(video_path)
    duration = int(clip.duration)
    video_text = []


    for i in range(0, duration, segment_length):
        start = i
        end = min(i + segment_length, duration)
        subclip = clip.subclipped(start, end)

        subclip.write_videofile("/root/app/data/tmp/tmp.mp4", codec="libx264", audio_codec="aac", logger=None)
        
        # do video2text
        text = video2text("/root/app/data/tmp/tmp.mp4")
        video_text.append(text)

    return video_text

# load the video and split to images
def load_video2post(video_path: str, group_size = 9, frame_interval = None):
    cap = cv2.VideoCapture(video_path)

    # get FPS and time
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total_frames / fps
    print(f"video times: {duration:.2f} s, {fps:.2f} image per seconed.")

    if frame_interval == None:
        frame_interval = int(fps)  # 每秒抓一張

    img_list = []
    count = 0
    saved = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        if count % frame_interval == 0:
            _, buffer = cv2.imencode('.jpg', frame)
            image = binary2base64(buffer)
            img_list.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/jpg;base64,{image}"
                }
            })
            saved += 1

        count += 1

    cap.release()
    print(f"Done, split {saved} image splited.")
    group = [img_list[i:i+group_size] for i in range(0, len(img_list), group_size)]
    print(f"number of group: {len(group)}")

    # delete video
    if os.path.exists(video_path):
        os.remove(video_path)
        print(f"{video_path} deleted.")
    else:
        print("The file isn't exit.")

    return group

# video2text
def video2text(video_path:str):
    if not os.path.isfile(video_path):
        sys.exit("Input file not found.")

    with tempfile.TemporaryDirectory() as tmp:
        wav  = to_wav(video_path, tmp)
        text = run_cpp(wav, "auto", min(os.cpu_count(), 8))
    return text

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
        "/usr/local/bin/whisper-cli", "-m", MODEL, "-f", wav,
        "-l", lang,            # "auto" or "en", "es", "fr", …
        "-bs", "1",            # greedy decode
        "-t", str(threads),
        "-otxt", "-of", pref, "-np"
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    with open(pref + ".txt", encoding="utf-8") as f:
        return f.read().strip()

