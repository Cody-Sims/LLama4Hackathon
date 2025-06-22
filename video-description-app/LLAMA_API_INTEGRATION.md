# Llama API Integration

This document describes the integration of the Llama API into the video description application.

## Overview

The Llama API is the primary AI service used to generate descriptions of videos based on extracted frames and transcribed audio. The integration involves:

1. Creating a JavaScript module (`llama_api.js`) that provides functions for interacting with the Llama API
2. Updating the backend.js file to use these functions exclusively
3. Modifying the video processing logic to match the format expected by the Llama API

## Configuration

The Llama API configuration is stored in `config.json` with the following structure:

```json
{
  "url": "https://api.llama.com/v1/chat/completions",
  "api_key": "YOUR_API_KEY"
}
```

You can also set the API key using the `LLAMA_API_KEY` environment variable.

## API Functions

The `llama_api.js` module provides the following functions:

- `post2inference(model, system, content, max_tokens, temperature)`: Sends a request to the Llama API and returns the generated text
- `binary2base64(buffer)`: Converts binary image data to base64
- `processVideoFrames(framesPaths)`: Processes video frames for the Llama API
- `generateVideoDescription(transcript, framesPaths)`: Generates a video description using the Llama API

## Usage

The integration is used in the `/api/process-video` endpoint in `backend.js`. The endpoint:

1. Extracts frames from the uploaded video
2. Transcribes the audio
3. Calls the Llama API to generate a description
4. Returns the generated description to the client

## Directory Structure

The integration adds the following directories:

- `data/video`: Stores uploaded videos
- `data/record`: Stores generated descriptions

## Error Handling

If the Llama API call fails, the application falls back to a mock response based on the transcript.