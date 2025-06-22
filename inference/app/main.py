# -*- coding: utf-8 -*-
# version = 1
# realse date = 20250206
# owner = Dake

import uvicorn

import fastapi
from fastapi import FastAPI


from datetime import datetime, timedelta

import os
import ssl
import socket
import pydantic
import traceback
from importlib.metadata import version
from contextlib import asynccontextmanager

# For auth-----------------------------------------------
import time
# For auth-----------------------------------------------

import sys
import socket
import starlette
# AI_team self packacge
from routers import (
    video_analyzer,
    video_chat
)
from logzero import logger

@asynccontextmanager
async def lifespan(app: FastAPI):

    # Startup event
    logger.info("="*150)
    logger.info('Service startup')
    logger.info(f"FastAPI version: {fastapi.__version__}")
    logger.info(f"Pydantic version: {pydantic.__version__}")
    logger.info(f"Starlette version: {starlette.__version__}")
    logger.info(f"Uvicorn version: {version('uvicorn')}")
    logger.info('Service startup complete.')

    yield
    # Shutdown event
    logger.info('Service shutdown')

app = FastAPI(lifespan=lifespan)
origins = [ "*" ]


app.include_router(video_analyzer.router, prefix="/video", tags=["video_analyze"])
#app.include_router(video_chat.router, prefix="/video", tags=["video_analyze"])


# ----------- AuthMiddleware init end--------------------------------------------------

# check service by Haproxy
@app.get('/HealthCheck', status_code=fastapi.status.HTTP_200_OK)
def perform_healthcheck():
    return {'healthcheck': 'Everything OK!'}

# ---api input json format config-------------------------------------------
@app.get("/")
def read_root():
    return {"Hello": "World"}

# -------api end----------------------------------------------------------

if __name__ =="__main__":

    uvicorn.run(
        "main:app",
        host = "0.0.0.0",
        port = 8001,
        # ssl_version = ssl.PROTOCOL_TLSv1_2,
        #ssl_ciphers = "AES256-GCM-SHA384:AES128-GCM-SHA256",
        # workers = workers
        reload = True
    )