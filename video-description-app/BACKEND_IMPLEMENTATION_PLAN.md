1. Hackathon Goal: The Bare Minimum Viable Product (MVP)

The sole objective is to create a backend that can accept a short video, understand its contents using AI, and return a descriptive script to the frontend. The frontend will then handle the Text-to-Speech (TTS) and synchronized playback.

2. Simplified Hackathon Architecture

We'll use a single, monolithic Node.js server. No need for separate services, gateways, or databases. The entire process will be handled in one request-response cycle.

Data Flow:

Frontend (React) → POST /api/process-video → Node.js/Express Server → Return JSON Script → Frontend

Inside the Server:

Receives video file.

Uses FFmpeg to extract frames and audio.

Uses an AI Service for transcription (if needed).

Calls Llama4 with frames + transcript.

Sends back the generated script.

3. Minimalist Tech Stack

Framework: Node.js with Express.js.

File Handling: multer for handling video file uploads.

Video & Audio Processing: fluent-ffmpeg, a user-friendly wrapper around the FFmpeg command-line tool.

AI API Calls: 
- axios or the native fetch to communicate with the Llama4 API
- axios for communicating with the OpenAI Whisper API (if using direct API approach)

Python Integration (if using the Python script approach):
- child_process module to execute the transcribe.py script
- Ensure Python environment has the OpenAI Whisper package installed

Dependencies:
```
npm install express multer fluent-ffmpeg axios form-data dotenv cors
```

Note: Since we're using ES modules, make sure the package.json has `"type": "module"` specified.

Storage: No database or S3 bucket. We'll process files directly from temporary local storage on the server.

4. The One Essential API Endpoint

We only need one endpoint to power the entire application.

POST /api/process-video

Request: multipart/form-data containing the video file.

Response: A JSON object containing the generated script.

{
  "success": true,
  "script": "A person is typing on a modern laptop, their fingers moving quickly across the keyboard..."
}

5. Hackathon Implementation Steps (The To-Do List)

This is the core execution plan, broken down into definitive tasks.

Task 1: Setup Express Server & File Upload

Initialize a Node.js project (npm init -y).

Install required dependencies:
```
npm install express multer fluent-ffmpeg axios form-data dotenv
```

Create a .env file for environment variables:
```
OPENAI_API_KEY=your_openai_api_key_here
LLAMA4_API_KEY=your_llama4_api_key_here
PORT=3000
```

Create a basic Express server with the necessary imports (using ES modules):
```javascript
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import ffmpeg from 'fluent-ffmpeg';
import axios from 'axios';
import FormData from 'form-data';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import cors from 'cors';

// Load environment variables
dotenv.config();

// ES module compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for frontend
app.use(cors());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    // Accept only video files
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});
```

Implement the POST /api/process-video endpoint using multer to accept a single video file and save it to a temporary directory (e.g., ./uploads):
```javascript
app.post('/api/process-video', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No video file uploaded' });
    }
    
    const videoPath = req.file.path;
    // Processing logic will go here
    
    // Return a response
    res.json({ success: true, message: 'Video received, processing started' });
  } catch (error) {
    console.error('Error processing video:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

Task 2: Take Snapshots of Images from the Video

Install fluent-ffmpeg. You will also need to have FFmpeg installed on the machine running the server.

Inside your endpoint logic, after the file is uploaded, use fluent-ffmpeg to extract a set number of frames (e.g., 5-10 frames) from the video.

Save these frames as temporary image files (e.g., frame-1.png, frame-2.png, etc.) or, for efficiency, convert them directly to Base64 strings in memory to be used in the API call.

Task 3: Transcribe the Audio to Text (for Context)

Use fluent-ffmpeg to extract the audio track from the uploaded video into a temporary audio file (e.g., audio.wav). We'll follow the approach from transcribe.py, which extracts audio as a 16-kHz mono WAV file for optimal processing with Whisper:

```javascript
// Extract audio from video
const extractAudio = (videoPath, outputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .outputOptions([
        '-vn',                  // No video
        '-acodec', 'pcm_s16le', // 16-bit PCM
        '-ar', '16000',         // 16 kHz
        '-ac', '1'              // Mono
      ])
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .run();
  });
};
```

For transcription, we have two options:

1. **Node.js Integration with Python**: Use child_process to call the existing transcribe.py script:

```javascript
const transcribeWithPython = (audioPath, modelSize = 'small') => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', [
      'transcribe/transcribe.py',
      audioPath,
      '--model', modelSize
    ]);
    
    let transcript = '';
    pythonProcess.stdout.on('data', (data) => {
      transcript += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        resolve(transcript.trim());
      } else {
        reject(new Error(`Transcription process exited with code ${code}`));
      }
    });
  });
};
```

2. **Direct OpenAI Whisper API**: Use the OpenAI API directly from Node.js:

```javascript
const transcribeWithOpenAI = async (audioPath) => {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(audioPath));
  formData.append('model', 'whisper-1');
  
  const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', 
    formData, 
    {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      }
    }
  );
  
  return response.data.text;
};
```

Store the resulting transcript in a variable. This text provides crucial context for the AI.

Task 4: Design the Llama4 API Call (The "Magic")

Read the image frames from Task 2 and convert them to Base64 strings if you haven't already.

Combine the visual data (frames) and audio data (transcript) into a single, powerful prompt for the Llama4 multimodal model.

Example Llama4 API Call Body:

{
  "prompt": "You are an assistant creating a vivid audio description for a visually impaired user. Based on the following video frames and the spoken audio transcript, generate a single, concise paragraph describing the scene. Focus on key actions and objects. Use the present tense.",
  "transcript": "...(the transcribed text from Task 3)...",
  "images": [
    "data:image/png;base64,...(base64 string for frame 1)...",
    "data:image/png;base64,...(base64 string for frame 2)..."
  ]
}

Use axios or fetch to make the POST request to the Llama4 API endpoint.

Task 5: Finalize and Return the Response

Get the descriptive text from the Llama4 API response.

Perform any minor cleanup if necessary (e.g., trimming whitespace).

Send this text back to the frontend in the final JSON response.

Crucially, delete all temporary files (uploaded video, frames, audio) before sending the response to keep your server clean:

```javascript
// Helper function to clean up temporary files
const cleanupFiles = (filePaths) => {
  filePaths.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted temporary file: ${filePath}`);
    }
  });
};

// In your endpoint handler:
// ...processing logic...

// Clean up at the end
const filesToCleanup = [
  videoPath,
  audioPath,
  ...framesPaths
];
cleanupFiles(filesToCleanup);

// Send response
res.json({
  success: true,
  script: generatedDescription
});
```

Note on TTS: The frontend is already set up to handle Text-to-Speech. Let's keep it there. It's simpler and avoids the backend having to generate and send an audio file, which is slower.

6. Complete Implementation Example

Here's a sketch of how the complete implementation might look (using ES modules):

```javascript
// Note: This example uses ES module syntax
app.post('/api/process-video', upload.single('video'), async (req, res) => {
  const tempFiles = [];
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No video file uploaded' });
    }
    
    const videoPath = req.file.path;
    tempFiles.push(videoPath);
    
    // 1. Create temp directory for processing
    const processingDir = path.join(__dirname, 'processing', `job-${Date.now()}`);
    fs.mkdirSync(processingDir, { recursive: true });
    
    // 2. Extract frames from video
    const framesDir = path.join(processingDir, 'frames');
    fs.mkdirSync(framesDir, { recursive: true });
    
    const framesPaths = await extractFrames(videoPath, framesDir);
    tempFiles.push(...framesPaths);
    
    // 3. Extract audio and transcribe
    const audioPath = path.join(processingDir, 'audio.wav');
    tempFiles.push(audioPath);
    
    await extractAudio(videoPath, audioPath);
    
    // Choose one transcription method:
    // const transcript = await transcribeWithPython(audioPath);
    const transcript = await transcribeWithOpenAI(audioPath);
    
    // 4. Convert frames to base64
    const base64Frames = await Promise.all(framesPaths.map(async (framePath) => {
      const data = await fs.promises.readFile(framePath);
      return `data:image/png;base64,${data.toString('base64')}`;
    }));
    
    // 5. Call Llama4 API
    const llama4Response = await axios.post(
      'https://api.llama4.ai/generate',
      {
        prompt: "You are an assistant creating a vivid audio description for a visually impaired user. Based on the following video frames and the spoken audio transcript, generate a single, concise paragraph describing the scene. Focus on key actions and objects. Use the present tense.",
        transcript: transcript,
        images: base64Frames
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.LLAMA4_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const generatedDescription = llama4Response.data.text;
    
    // 6. Clean up and return response
    cleanupFiles(tempFiles);
    fs.rmdirSync(processingDir, { recursive: true });
    
    res.json({
      success: true,
      script: generatedDescription
    });
    
  } catch (error) {
    console.error('Error processing video:', error);
    
    // Clean up on error too
    cleanupFiles(tempFiles);
    
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});
```

7. Stretch Goals (If You Have Time)

Allow Longer Videos: Modify the FFmpeg logic in Task 2 to take snapshots every X seconds (e.g., every 2 seconds) instead of a fixed number of frames. This allows the backend to handle videos of varying lengths by sending more frames to the AI.

Video Q&A:

Create a new endpoint: POST /api/ask-question.

This endpoint would accept the video file (or perhaps an ID of a previously processed video) and a text question from the user.

The backend would perform the same frame/audio extraction and then send a new prompt to Llama4, like: Based on these frames and transcript, answer the following question: '{user_question}'.

This simplified plan eliminates all non-essential features, allowing you to focus on a single, successful end-to-end flow to impress the hackathon judges.