import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

// ES module compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const AUDIO_PATH = path.join(__dirname, 'output', 'audio.wav');

// Helper function to transcribe audio using Python script
const transcribeWithPython = (audioPath, modelSize = 'small') => {
  return new Promise((resolve, reject) => {
    // Use absolute path to the script
    const scriptPath = path.resolve(path.join(__dirname, '..', '..', 'transcribe', 'transcribe.py'));
    console.log(`Using Python script at: ${scriptPath}`);
    
    // Check if the script exists
    if (!fs.existsSync(scriptPath)) {
      reject(new Error(`Transcription script not found at ${scriptPath}`));
      return;
    }
    
    console.log(`Running command: python ${scriptPath} ${audioPath} --model ${modelSize}`);
    
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

// Run test
async function runTest() {
  try {
    console.log('Testing transcription...');
    
    // Check if audio file exists
    if (!fs.existsSync(AUDIO_PATH)) {
      console.error(`Audio file not found at ${AUDIO_PATH}`);
      console.log('Please run test_backend.js first to extract audio from the test video');
      return;
    }
    
    console.log(`Audio file found: ${AUDIO_PATH}`);
    
    // Test transcription
    console.log('Transcribing audio...');
    try {
      const transcript = await transcribeWithPython(AUDIO_PATH);
      console.log(`✅ Successfully transcribed audio: "${transcript}"`);
    } catch (error) {
      console.error(`❌ Failed to transcribe audio: ${error.message}`);
      
      // Test Python installation
      console.log('\nChecking Python installation...');
      const pythonVersionProcess = spawn('python', ['--version']);
      
      pythonVersionProcess.stdout.on('data', (data) => {
        console.log(`Python version: ${data.toString().trim()}`);
      });
      
      pythonVersionProcess.stderr.on('data', (data) => {
        console.error(`Python version error: ${data.toString().trim()}`);
      });
      
      // Test Whisper installation
      console.log('\nChecking Whisper installation...');
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
        
        // Test FFmpeg installation
        console.log('\nChecking FFmpeg installation...');
        const ffmpegVersionProcess = spawn('ffmpeg', ['-version']);
        
        ffmpegVersionProcess.stdout.on('data', (data) => {
          console.log(`FFmpeg version: ${data.toString().trim().split('\\n')[0]}`);
        });
        
        ffmpegVersionProcess.stderr.on('data', (data) => {
          console.error(`FFmpeg version error: ${data.toString().trim()}`);
        });
      });
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
runTest();