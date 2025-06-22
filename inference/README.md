## Running

docker build -f Dockerfile -t inference:v1 .

## run container

docker run -it -p port:8001 --cpus=8 --name=container_name inference:v1

## video_analyze

url: http://0.0.0.0:port/video/analyze
input
```json
format: {
        "attachments": [
            {
                "file_content": "video_base64string",
                "file_name": "inception.mp4"
            }
        ]
}
```
response
```json
format: {
        "statuscode": 200,
        "content": "content",
        "request_guid": "guid"
}
```

