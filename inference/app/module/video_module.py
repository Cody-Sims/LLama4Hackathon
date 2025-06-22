import os 
import cv2
from module.image_module import binary2base64
import base64
from pathlib import Path

def base642video(base64_video, request_guid):
    # load video
    b64 = base64_video.split("data:video/mp4;base64,")[0]

    # 解碼並寫入
    Path(f"/root/app/data/video/{request_guid}.mp4").write_bytes(base64.b64decode(b64))


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