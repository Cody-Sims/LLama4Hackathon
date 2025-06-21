from module.post_module import (
    post2inference
)
from module.image_module import (
    image2base64,
    binary2base64
)

import os 
import cv2
import json
import time
with open('/root/app/config.json') as jsonfile:
    iniConfig = json.load(jsonfile)

requirement = iniConfig
model = "Llama-4-Maverick-17B-128E-Instruct-FP8"

'''
# test1 (traslate and report format)
language_style = "japanese"
system = f"You are document helper. Your task is organize long text articles and write titles based on Introduction, Methods, Results, and Conclusions. Please use {language_style} language."
content = """
剛分享了Meta的季度財報。我們在AI、眼鏡和社群媒體的未來持續取得良好進展。我很期待這些努力在2025年進一步擴大規模。以下是我在電話會議上所說的內容：
我們以強勁的姿態結束了2024年，現在每天至少有超過33億人在使用我們的其中一款應用程式。這將會是非常重要的一年。我知道每年都感覺像是重要的一年，但今年感覺比以往任何時候都更特別，因為我們大多數長期計畫的發展軌跡，到今年年底將會更加清晰。所以我一直跟我們的團隊說，這將會非常緊湊，因為我們只有大約48週的時間來達成我們想要的發展軌跡。
在AI方面，我預計今年將會有超過10億人使用高度智慧且個人化的AI助理，而我預計Meta AI將成為領先的AI助理。Meta AI的使用者數量已經超過任何其他助理，而且一旦服務達到這種規模，通常就會發展出持久的長期優勢。我們今年有一個非常令人興奮的路線圖，其獨特的願景側重於個人化。我們相信，並非所有人都想使用相同的AI——人們希望他們的AI能根據他們的背景、興趣、個性、文化以及他們看待世界的方式來個人化。我不認為會有一個所有人都使用相同東西的巨大AI。人們將可以選擇AI對他們來說如何運作和呈現。我仍然認為這將會是我們創造出的最具變革性產品之一。我們有一些有趣的驚喜，我想大家今年都會喜歡。
我認為今年很有可能成為Llama和開源成為最先進和最廣泛使用的AI模型的一年。Llama 4的訓練進展順利。Llama 4 mini的預訓練已經完成，我們的推理模型和更大的模型看起來也很好。我們在Llama 3的目標是讓開源模型與封閉模型競爭，而我們在Llama 4的目標是領先。Llama 4將原生支援多模態——它是一個全能模型——並且它將具有自主能力，因此它將會是新穎的，並且將會開啟許多新的應用案例。我期待在接下來的幾個月裡分享更多我們今年的計畫。
我也預計2025年將會是能夠建立一個AI工程代理的一年，該代理具有大約相當於優秀中級工程師的編碼和解決問題的能力。這將是一個重大的里程碑，並可能成為歷史上最重要的創新之一，而且隨著時間的推移，也可能成為一個非常大的市場。我相信，率先建立這個的任何公司都將在部署它以推進其AI研究和塑造該領域方面具有顯著優勢。所以這就是我認為今年將決定未來方向的另一個原因。
我們的Ray-Ban Meta AI眼鏡非常受歡迎，今年將會是我們了解AI眼鏡作為一個類別的發展軌跡的一年。消費者電子產品歷史上許多突破性的產品，在第三代銷售量都達到了500萬到1000萬台。這將是決定性的一年，它將決定我們是否走在走向數億甚至最終數十億副AI眼鏡的道路上——眼鏡成為我們一直在談論的下一個計算平台——或者這只會是一個更漫長的過程。但總體而言，看到人們認識到這些眼鏡是AI的完美外形因素——以及只是很棒、時尚的眼鏡——這很棒。
這些都是巨大的投資——尤其是在長期內我們將投資數千億美元於AI基礎設施。我上週宣布，我們預計今年將線上新增近1GW的容量，我們正在建設一個2GW，甚至可能更大的AI數據中心，如果把它放在那裡，它將覆蓋曼哈頓的很大一部分。
我們計畫同時積極投資利用我們的AI進展來提高營收增長的計畫來為所有這些提供資金。我們制定了一個計畫，希望在未來幾年加速這些計畫的步伐——這就是我們許多新增員工的目標。而我們執行得如何，也將決定我們未來幾年的財務軌跡。
還有一些其他與我們的應用程式系列相關的重要產品趨勢，我認為我們今年也會了解更多。我們將了解TikTok會發生什麼，而不管發生什麼，我都預計Instagram和Facebook上的Reels將繼續增長。我預計Threads將繼續朝著成為領先的討論平台發展，並在未來幾年達到10億用戶。Threads目前擁有超過3.2億月活躍用戶，並且每天新增用戶超過100萬。我預計WhatsApp將繼續獲得市場份額，並朝著成為美國領先的訊息平台邁進，就像它在世界其他許多地區一樣。WhatsApp目前在美國擁有超過1億月活躍用戶。Facebook擁有超過30億月活躍用戶，我們正專注於提升其文化影響力。我很期待今年能回歸一些OG Facebook。
這也將是元宇宙的一個關鍵年份。使用Quest和Horizon的人數一直在穩步增長——而今年我們一直在努力的一些長期投資將使元宇宙在視覺上更加令人驚嘆和鼓舞人心，將真正開始落地。我認為到今年年底，我們將對Horizon的發展軌跡了解更多。
這也將是重新定義我們與政府關係的一年。我們現在有一個對我們領先的公司感到自豪的美國政府，它優先考慮美國科技的勝利，並將捍衛我們的價值觀和海外利益。我對這可能帶來的進步和創新感到樂觀。
所以這將會是重要的一年。我認為這是我們行業有史以來最令人興奮和充滿活力的一年。從AI、眼鏡、大型基礎設施專案，到努力加速我們的業務，再到構建社群媒體的未來——我們有很多事情要做。我認為我們將會創造一些很棒的東西，來塑造人類聯繫的未來。一如既往，我感謝所有與我們一起踏上這段旅程的人。
"""
'''
'''
# test2 (reasoning)
language_style = "english"
system = f"You are a Project manager. Your task is to break down tasks according to user requirements, and finally assign them to specific groups based on the broken down tasks. Groups include algorithm development, code writing, code testing, and code deployment. The reply format needs to have task breakdown and all content must be between the tags <reason>...</reason> and finally format is group_name: to-do-list. Please use {language_style} language."
content = """
1. Project Name

TaskMaster – Cross-platform task management app

2. Objectives and Introduction

Develop an easy-to-use task management app to help users record daily to-do items, set reminders, categorize tasks, and synchronize data to the cloud for cross-device use.

3. Main functional requirements

3.1 User account system
• Support email and password registration/login
• Third-party login (Google, Apple ID)
• Forgot password function (send reset link to email)

3.2 Task management function
• Add/edit/delete tasks
• Tasks can include:
• Title (required)
• Description (optional)
• Deadline/time
• Priority (high/medium/low)
• Category (work/personal/other)
• Support dragging to adjust the order of tasks

3.3 Notifications and reminders
• Send local notifications based on task deadlines
• Daily/weekly reminders can be set

3.4 Cloud synchronization and backup
• All data must be automatically backed up to the cloud (Firebase)
• Support multi-device synchronization (mobile phone/tablet)

3.5 Interface and user experience
• Support dark mode
• Multi-language support (at least Chinese and English)
• Simple navigation and no ads

4. Technical requirements
• Front-end platform: React Native (iOS + Android)
• Back-end: Firebase (Authentication, Firestore, Cloud Functions)
• Notification system: Firebase Cloud Messaging
• Storage format: JSON file structure, stored in Firestore

5. Non-functional requirements
• App startup time < 2 seconds
• Task storage operation delay < 300 milliseconds
• Data transmission must be encrypted (HTTPS / SSL)

6. Version planning (MVP stage)
• Single user task management
• Local and cloud synchronization
• Manually add and delete tasks
• Login/registration basic functions
"""
'''
'''
# test3 (image)
language_style = "traditional chinese"
system = ""
content = f"Your are an biochemistry scientist. Please tell me the infotmation in the figure and use {language_style} language."
image = image2base64("./nucleotide_backbone.jpg")
'''

def load_video2post(video_path: str, group_size = 9, frame_interval = None):
    cap = cv2.VideoCapture(video_path)

    # 取得影片的 FPS 與總長度
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total_frames / fps
    print(f"video times: {duration:.2f} s， {fps:.2f} image per seconed.")

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
    return group

result = load_video2post("./inception.mp4",group_size = 9)

post_content_prefix = [
    {
        "type": "text",
        "text": "You are an accessibility assistant describing a video in detail to vision-impaired users. Please succinctly describe the attached photos and transcribed audio to the user.\nThere will be a sequence of images, please process the images in order and generate the description with this order in mind.\nSend the description in a storytelling tone so the user feels like they're watching a movie.\nDo not set the scene or include any filler text, get right into the storytelling.\nDon't provide more than 75 words.",
    }
]

n = 9
for i in result:
    post_content = post_content_prefix + i
    system = ""
    start = time.time()
    post2inference(model, system, post_content, requirement, image = None, max_tokens = 1024, temperature = 0.1, mode = 'image_multiple')
    end = time.time()
    cost_time =round(end-start,2)
    print(f"cost: {cost_time}s")
    print(f"======= {n} s =======")
    n += 9