# schemas.py

from pydantic import BaseModel

class Videoinput(BaseModel):
    attachments: list

class Chatinput(BaseModel):
    content: str
 