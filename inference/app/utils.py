import os 
import json
import time
import traceback
from logzero import logger
from module.post_module import post2inference


def response_description_streaming(model, group, group_video, requirement, request_guid):
    
    # post to inference API (and save all record)
    all_result = ""
    n = 9
    try:
        for i in range(len(group)):
            transcribed_audio = group_video[i]
            logger.info(f"video text: {transcribed_audio}")
            post_content_prefix = [
                {
                    "type": "text",
                    "text": f"You are an accessibility assistant describing a video in detail to vision-impaired users. Please succinctly describe the attached photos and transcribed audio to the user.\nThere will be a sequence of images, please process the images in order and generate the description with this order in mind.\nSend the description in a storytelling tone so the user feels like they're watching a movie.\nThe transcribed audio is: {transcribed_audio}\nDo not set the scene or include any filler text, get right into the storytelling.\n\"Just only response below 25 words\"",
                }
            ]
            post_content = post_content_prefix + group[i]
            system = ""
            start = time.time()
            response_desc = post2inference(model, system, post_content, requirement, image = None, max_tokens = 128, temperature = 0.3, mode = 'image_multiple')
            end = time.time()
            cost_time =round(end - start,2)
            logger.info(f"cost: {cost_time}s")
            logger.info(f"======= {n} s =======")
            all_result += (response_desc + f"\n======= {n} s =======\n")
            n += 9
            logger.info(response_desc)
            response_json = {"statecode":200, "content": response_desc, "request_guid": request_guid}
            yield json.dumps(response_json)
    except:
        logger.info(traceback.format_exc())
        response_json = {"statecode":500, "content": "API failed", "request_guid": request_guid}
        yield json.dumps(response_json)
    finally:
        with open(f"/root/app/data/record/{request_guid}.txt", "w") as file:
            file.write(all_result)
