import requests
import urllib3
import json
from llama_api_client import LlamaAPIClient
urllib3.disable_warnings()

# post to llama api
def post2inference(model:str, system:str, content:str, requirement:dict, image = None, max_tokens = 256, temperature = 0.1, mode = 'text'):
    # get requirement 
    url = requirement['url']
    API_KEY = requirement['api_key']
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }
    
    if mode == 'text':
        postjson = {
            "model": model,
            "messages": [
            {
                "role": "system", 
                "content": system
            },
            {
                "role": "user", 
                "content": content
            }
            ],
            "max_tokens": max_tokens,
            "temperature": temperature,
            #"stream": True,
        }

        res = requests.post(url, headers=headers, json = postjson, verify=False, timeout=10)
        if res.status_code == 200:
            print(res.status_code)
            return(res.json()["completion_message"]["content"]["text"])

        else:
            print(res.status_code)
            print(res.content)
            return ""

    if mode == 'text_stream':
        client = LlamaAPIClient(api_key = API_KEY)

        stream = client.chat.completions.create(
            messages=[
                {
                    "role": "system", 
                    "content": system
                },
                {
                    "role": "user", 
                    "content": content
                }
            ],
            model = model,
            stream = True,
            temperature = temperature
        )
        for chunk in stream:
            print(chunk.event.delta.text, end="", flush=True)

    elif mode == 'image':
        postjson={
            "model": model,
            "messages": [
                {
                    "role": "user",
                    "system": system,
                    "content": [
                        {
                            "type": "text",
                            "text": content,
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image}"
                            },
                        },
                    ],
                },
            ]
        }
        res = requests.post(url, headers=headers, json = postjson, verify=False, timeout=10)
        if res.status_code == 200:
            print(res.status_code)
            print(res.json()['completion_message']['content']['text'])

        else:
            print(res.status_code)
            print(res.content)

    elif mode == 'image_multiple':
        postjson={
            "model": model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": [
                {
                    "role": "user",
                    "system": system,
                    "content": content
                },
            ]
        }
        res = requests.post(url, headers=headers, json = postjson, verify=False, timeout=60)
        if res.status_code == 200:
            print(res.status_code)
            print(res.json()['completion_message']['content']['text'])
            return res.json()['completion_message']['content']['text']

        else:
            print(res.status_code)
            print(res.content)
            return ""

