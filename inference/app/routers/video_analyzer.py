import uuid
import json
import time
from logzero import logger
import traceback
from datetime import datetime


import requests
import fastapi
from fastapi import APIRouter
from fastapi.responses import JSONResponse, StreamingResponse
from starlette.requests import Request

from config import iniConfig
from schemas import Videoinput

# module 
from module.post_module import (
    post2inference
)
from module.video_module import (
    load_video2post,
    base642video
)
from utils import (
    response_description_streaming
)

router = APIRouter()
requirement = iniConfig

@router.post("/analyze")
async def video_analyze(Videoinput: Videoinput):
    time_start = datetime.now()
    sub_url = "/analyze"
    request_guid = str(uuid.uuid4())

    attachments = Videoinput.attachments
    video_name = attachments[-1]['file_name']
    video_content = attachments[-1]['file_content']
    model = "Llama-4-Maverick-17B-128E-Instruct-FP8"

    # logger given info #
    logger.info(f"="*80)
    logger.info(f"Function:/{sub_url}")
    logger.info(f"request guid: {request_guid}")
    logger.info(f"model: {model}")
    logger.info(f"video name: {video_name}")
    logger.info(f"JSON parameter info")
    logger.info(f"="*80)

    # video processing
    try:
        base642video(video_content, request_guid)
        group = load_video2post(f"/root/app/data/video/{request_guid}.mp4")
        print("video pre-processing done.")
        return StreamingResponse(response_description_streaming(model, group, requirement, request_guid), media_type="text/plain")
    except:
        print(traceback.format_exc())

    
    