import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ffmpeg from 'fluent-ffmpeg';
import { spawn } from 'child_process';

// ES module compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const TEST_VIDEO_PATH = path.join(__dirname, '..', '..', 'test_video.mp4'); // Look for test video in the workspace root directory
const OUTPUT_DIR = path.join(__dirname, 'output');
const FRAMES_DIR = path.join(OUTPUT_DIR, 'frames');
const AUDIO_PATH = path.join(OUTPUT_DIR, 'audio.wav');

// Create output directories if they don't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

if (!fs.existsSync(FRAMES_DIR)) {
  fs.mkdirSync(FRAMES_DIR, { recursive: true });
}

// Helper function to extract frames from video
const extractFrames = (videoPath, outputDir, frameCount = 5) => {
  return new Promise((resolve, reject) => {
    // Get video duration
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(err);
      
      console.log('Video metadata:', metadata.format);
      const duration = metadata.format.duration;
      const framesPaths = [];
      
      // Take screenshots at regular intervals
      const interval = duration / (frameCount + 1);
      
      // Create an array of promises for each screenshot
      const screenshotPromises = [];
      
      for (let i = 1; i <= frameCount; i++) {
        const timestamp = interval * i;
        const outputPath = path.join(outputDir, `frame-${i}.png`);
        framesPaths.push(outputPath);
        
        const promise = new Promise((resolveFrame, rejectFrame) => {
          ffmpeg(videoPath)
            .screenshots({
              count: 1,
              timestamps: [timestamp],
              filename: `frame-${i}.png`,
              folder: outputDir
            })
            .on('end', () => resolveFrame())
            .on('error', (err) => rejectFrame(err));
        });
        
        screenshotPromises.push(promise);
      }
      
      // Wait for all screenshots to be taken
      Promise.all(screenshotPromises)
        .then(() => resolve(framesPaths))
        .catch((err) => reject(err));
    });
  });
};

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
    
    // Use the Python interpreter from the virtual environment
    const venvPythonPath = path.resolve(path.join(__dirname, '..', '..', 'venv', 'bin', 'python'));
    const pythonCommand = fs.existsSync(venvPythonPath) ? venvPythonPath : 'python';
    console.log(`Using Python interpreter: ${pythonCommand}`);
    
    const pythonProcess = spawn(pythonCommand, [
      scriptPath,
      audioPath,
      '--model', modelSize
    ]);
    
    let transcript = '';
    let errorOutput = '';
    
    pythonProcess.stdout.on('data', (data) => {
      transcript += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error(`Python stderr: ${data}`);
    });
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        resolve(transcript.trim());
      } else {
        reject(new Error(`Transcription process exited with code ${code}: ${errorOutput}`));
      }
    });
  });
};

// Run tests
async function runTests() {
  try {
    console.log('Starting backend tests...');
    
    // Check if test video exists
    if (!fs.existsSync(TEST_VIDEO_PATH)) {
      console.error(`Test video not found at ${TEST_VIDEO_PATH}`);
      return;
    }
    
    console.log(`Test video found: ${TEST_VIDEO_PATH}`);
    
    // Test 1: Extract frames
    console.log('\nTest 1: Extracting frames...');
    const framesPaths = await extractFrames(TEST_VIDEO_PATH, FRAMES_DIR);
    console.log(`✅ Successfully extracted ${framesPaths.length} frames`);
    framesPaths.forEach(path => console.log(`  - ${path}`));
    
    // Test 2: Extract audio
    console.log('\nTest 2: Extracting audio...');
    await extractAudio(TEST_VIDEO_PATH, AUDIO_PATH);
    console.log(`✅ Successfully extracted audio to ${AUDIO_PATH}`);
    
    // Test 3: Transcribe audio
    console.log('\nTest 3: Transcribing audio...');
    try {
      const transcript = await transcribeWithPython(AUDIO_PATH);
      console.log(`✅ Successfully transcribed audio: "${transcript.substring(0, 100)}${transcript.length > 100 ? '...' : ''}"`);
    } catch (error) {
      console.error(`❌ Failed to transcribe audio: ${error.message}`);
      console.log('Checking if Python and Whisper are installed correctly...');
      
      // Test Python installation
      const pythonVersionProcess = spawn('python', ['--version']);
      pythonVersionProcess.stdout.on('data', (data) => {
        console.log(`Python version: ${data.toString().trim()}`);
      });
      
      // Test Whisper installation
      const pipListProcess = spawn('pip', ['list']);
      let pipOutput = '';
      pipListProcess.stdout.on('data', (data) => {
        pipOutput += data.toString();
      });
      
      pipListProcess.on('close', () => {
        if (pipOutput.includes('openai-whisper')) {
          console.log('✅ Whisper is installed');
        } else {
          console.log('❌ Whisper is not installed. Install it with: pip install openai-whisper');
        }
      });
    }
    
    console.log('\nTests completed!');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the tests
runTests();