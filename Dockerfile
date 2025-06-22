FROM ubuntu:22.04

# env setting
ENV DEBIAN_FRONTEND=noninteractive \
    TZ=Asia/Taipei

# update and install package
RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
        vim \
        curl \
        python3-pip \
        unixodbc \
        unixodbc-dev \
        libaio1 \
        tzdata \
        iputils-ping \
        traceroute \
        libgl1 \
        libglib2.0-0 \
        ffmpeg \
        nodejs \
        npm \
        python3.10-venv \
        make \
        git \
        cmake \
        build-essential \
        g++ \
        dnsutils && \
    rm -rf /var/lib/apt/lists/* /tmp/*

# set timezone
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone && \
    dpkg-reconfigure -f noninteractive tzdata

# set workdir
WORKDIR /root
RUN mkdir -p /root/

# copy the code
COPY ./video-description-app /root/video-description-app
COPY ./transcribe /root/transcribe
COPY ./setup_python_env.sh /root/setup_python_env.sh

RUN /root/setup_python_env.sh

# 安裝 NVM + Node.js LTS
RUN bash -c "\
    cd /root/video-description-app && \
    export NVM_DIR=\"/root/.nvm\" && \
    mkdir -p \$NVM_DIR && \
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash && \
    . \$NVM_DIR/nvm.sh && \
    nvm install 20 && \
    nvm use 20 && \
    npm install && \
    node -v && npm -v \
"

# 確保 nvm 環境持久化
ENV NVM_DIR=/root/.nvm
ENV NODE_VERSION=lts/*
ENV PATH="/root/.nvm/versions/node/$(ls /root/.nvm/versions/node)/bin:$PATH"

RUN git clone https://github.com/ggerganov/whisper.cpp.git /root/whisper.cpp
RUN cd /root/whisper.cpp && cmake -B build && cmake --build build --config Release

# transcribe an audio file
RUN mv /root/whisper.cpp/build/bin/whisper-cli /usr/local/bin/whisper-cli
RUN mkdir -p /root/.cache/whispercpp && \
    curl -L https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin \
    -o /root/.cache/whispercpp/ggml-tiny.bin

# set port
EXPOSE 3001
EXPOSE 5173
 
# set Entrypoint
COPY ./docker-entrypoint.sh /root/docker-entrypoint.sh
RUN chmod +x /root/docker-entrypoint.sh
#CMD ["node", "backend.js"]
ENTRYPOINT ["/root/docker-entrypoint.sh"]