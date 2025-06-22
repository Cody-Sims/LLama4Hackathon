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
        git \
        make \
        dnsutils && \
    rm -rf /var/lib/apt/lists/* /tmp/*

# set timezone
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone && \
    dpkg-reconfigure -f noninteractive tzdata

# set workdir
WORKDIR /root
RUN mkdir -p /root/

# install python package
COPY requirements.txt /root/requirements.txt
RUN python3 -m pip install --no-cache-dir --upgrade pip && \
    python3 -m pip install --no-cache-dir -r requirements.txt

RUN apt-get update && \
    apt-get install -y git cmake build-essential && \
    apt-get clean

# Clone whisper.cpp
RUN git clone https://github.com/ggerganov/whisper.cpp.git /root/whisper.cpp

# Build whisper.cpp（注意 cd 要寫在同一個 RUN）
RUN cd /root/whisper.cpp && \
    cmake -B build && \
    cmake --build build --config Release && \
    mv /root/whisper.cpp/build/bin/whisper-cli /usr/local/bin/whisper-cli


# copy the code
COPY ./app /root/app
 
# set port
EXPOSE 8001
 
# set Entrypoint
COPY ./docker-entrypoint.sh /root/docker-entrypoint.sh
RUN chmod +x /root/docker-entrypoint.sh
ENTRYPOINT ["/root/docker-entrypoint.sh"]

