# Video Description Generator

A web application that generates audio descriptions for videos using AI. This tool helps make video content more accessible for visually impaired users by providing detailed descriptions of what's happening in the video.

## Features

- Upload videos (MP4, WebM, MOV, AVI formats)
- AI-powered video content analysis
- Automatic transcription of audio
- Generation of descriptive text
- Text-to-speech playback synchronized with the video
- Voice customization options

## Tech Stack

- **Frontend**: React with Vite
- **Backend**: Node.js with Express
- **Video Processing**: FFmpeg
- **Transcription**: OpenAI Whisper
- **AI Description**: Llama 3 via Together.ai API

## Prerequisites

- Node.js (v16+)
- FFmpeg installed on your system
- Python 3.8+ (for transcription)
- OpenAI API key (for audio transcription fallback)
- Together.ai API key (for Llama 3 model access)

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/video-description-app.git
   cd video-description-app
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create environment files:

   For the backend (.env):
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   LLAMA4_API_KEY=your_together_ai_api_key_here
   PORT=3001
   ```
   
   Note: The `LLAMA4_API_KEY` environment variable is used for the Together.ai API key that provides access to the Llama 3 model.

   For the frontend (.env.local):
   ```
   VITE_BACKEND_URL=http://localhost:3001
   ```

4. Install Python dependencies for transcription:
   ```
   pip install openai-whisper
   ```

## Running the Application

1. Start the backend server:
   ```
   npm run backend
   ```

2. In a separate terminal, start the frontend development server:
   ```
   npm run dev
   ```

3. Open your browser and navigate to the URL shown in the terminal (typically http://localhost:5173)

## Testing

The project includes several test scripts to help diagnose issues:

1. Download a test video:
   ```
   npm run test:download
   ```

2. Test the backend components:
   ```
   npm run test:backend
   ```

3. Test just the transcription functionality:
   ```
   npm run test:transcription
   ```

4. Test OpenAI API transcription:
   ```
   npm run test:openai
   ```

5. Run a dedicated transcription server for testing:
   ```
   npm run transcription-server
   ```
   Then open `tests/transcription_test.html` in your browser to test it.

6. Run all tests:
   ```
   npm test
   ```

## Usage

1. Upload a video file (up to 50MB)
2. Click "Generate Description" to process the video
3. Once processing is complete, you can:
   - Read the generated description
   - Customize the voice settings
   - Play the video with the audio description

## Video Processing Details

The application processes videos in the following way:

1. **Frame Extraction**: The video is divided into 9-second segments, with one frame extracted per second.
2. **Audio Transcription**: The audio is extracted and transcribed using either a local Python script or the OpenAI Whisper API.
3. **AI Description Generation**: The frames and transcript are sent to the Llama 3 model via Together.ai API with a specific system prompt that:
   - Focuses on accessibility for vision-impaired users
   - Processes images in sequential order
   - Uses a storytelling tone
   - Keeps descriptions concise (under 75 words)
   - Avoids filler text and gets straight to the content

## Folder Structure

- `/src` - Frontend React code
- `/src/components` - React components
- `/transcribe` - Python script for audio transcription
- `/uploads` - Temporary storage for uploaded videos (created at runtime)
- `/processing` - Temporary storage for processing files (created at runtime)

## License

MIT
