import base64

# encode image to base64
def image2base64(image_path:str):
  with open(image_path, "rb") as img:
    return base64.b64encode(img.read()).decode('utf-8')
  
# encode binary to base64
def binary2base64(img):
  return base64.b64encode(img).decode('utf-8')