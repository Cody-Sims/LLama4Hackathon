import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import ffmpeg from 'fluent-ffmpeg';
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
const port = process.env.PORT || 3002; // Use a different port for testing

// Enable CORS
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
    if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video or audio files are allowed'));
    }
  }
});

// Helper function to extract audio from video
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

// Helper function to transcribe audio using Python script
const transcribeWithPython = (audioPath, modelSize = 'small') => {
  return new Promise((resolve, reject) => {
    // Use absolute path to the script
    const scriptPath = path.resolve(path.join(__dirname, '..', '..', 'transcribe', 'transcribe.py'));
    console.log(`Using Python script at: ${scriptPath}`);
    
    const pythonProcess = spawn('python', [
      scriptPath,
      audioPath,
      '--model', modelSize
    ]);
    
    let transcript = '';
    let errorOutput = '';
    
    pythonProcess.stdout.on('data', (data) => {
      const chunk = data.toString();
      transcript += chunk;
      console.log(`Python stdout: ${chunk}`);
    });
    
    pythonProcess.stderr.on('data', (data) => {
      const chunk = data.toString();
      errorOutput += chunk;
      console.error(`Python stderr: ${chunk}`);
    });
    
    pythonProcess.on('close', (code) => {
      console.log(`Python process exited with code ${code}`);
      if (code === 0) {
        resolve(transcript.trim());
      } else {
        reject(new Error(`Transcription process exited with code ${code}: ${errorOutput}`));
      }
    });
  });
};

// Helper function to clean up temporary files
const cleanupFiles = (filePaths) => {
  filePaths.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted temporary file: ${filePath}`);
    }
  });
};

// Transcription endpoint
app.post('/api/transcribe', upload.single('file'), async (req, res) => {
  const tempFiles = [];
  try {
    console.log('Received file upload request');
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    console.log(`File uploaded: ${req.file.originalname}, size: ${req.file.size} bytes`);
    const filePath = req.file.path;
    tempFiles.push(filePath);
    
    // Create temp directory for processing
    const processingDir = path.join(__dirname, 'processing', `job-${Date.now()}`);
    fs.mkdirSync(processingDir, { recursive: true });
    console.log(`Created processing directory: ${processingDir}`);
    
    // Extract audio if it's a video file
    let audioPath;
    if (req.file.mimetype.startsWith('video/')) {
      audioPath = path.join(processingDir, 'audio.wav');
      tempFiles.push(audioPath);
      
      console.log('Extracting audio from video...');
      await extractAudio(filePath, audioPath);
      console.log(`Audio extracted to: ${audioPath}`);
    } else {
      // If it's already an audio file, use it directly
      audioPath = filePath;
    }
    
    // Transcribe audio
    console.log('Starting transcription process...');
    let transcript;
    try {
      console.log('Attempting transcription with Python script...');
      transcript = await transcribeWithPython(audioPath);
      console.log('Python transcription successful');
    } catch (error) {
      console.error('Transcription failed:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Transcription failed', 
        details: error.message 
      });
    }
    
    // Clean up and return response
    console.log('Cleaning up temporary files...');
    cleanupFiles(tempFiles);
    if (fs.existsSync(processingDir)) {
      fs.rmdirSync(processingDir, { recursive: true });
      console.log(`Removed processing directory: ${processingDir}`);
    }
    
    console.log('Sending response to client');
    res.json({
      success: true,
      transcript: transcript
    });
    
  } catch (error) {
    console.error('Error processing file:', error);
    
    // Clean up on error too
    cleanupFiles(tempFiles);
    
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Transcription server is working correctly'
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Transcription server running on port ${port}`);
  console.log(`Test the API connection: http://localhost:${port}/api/test`);
});