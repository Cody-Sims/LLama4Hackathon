## build image

docker build -f Dockerfile -t video_description:v1 .

## run the container

docker run -it -p 3001:3001 -p 5173:5173 --name=video_description video_description:v1

## the cilent

http://localhost:5173