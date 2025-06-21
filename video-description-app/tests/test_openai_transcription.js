import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// ES module compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const AUDIO_PATH = path.join(__dirname, 'output', 'audio.wav');

// Helper function to transcribe audio using OpenAI API
const transcribeWithOpenAI = async (audioPath) => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  
  console.log(`Transcribing audio file: ${audioPath}`);
  
  const formData = new FormData();
  formData.append('file', fs.createReadStream(audioPath));
  formData.append('model', 'whisper-1');
  
  console.log('Sending request to OpenAI API...');
  
  const response = await axios.post(
    'https://api.openai.com/v1/audio/transcriptions', 
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

// Run test
async function runTest() {
  try {
    console.log('Testing OpenAI transcription...');
    
    // Check if audio file exists
    if (!fs.existsSync(AUDIO_PATH)) {
      console.error(`Audio file not found at ${AUDIO_PATH}`);
      console.log('Please run test_backend.js first to extract audio from the test video');
      return;
    }
    
    console.log(`Audio file found: ${AUDIO_PATH}`);
    
    // Test transcription
    console.log('Transcribing audio with OpenAI API...');
    try {
      const transcript = await transcribeWithOpenAI(AUDIO_PATH);
      console.log(`✅ Successfully transcribed audio: "${transcript}"`);
    } catch (error) {
      console.error(`❌ Failed to transcribe audio with OpenAI API:`);
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
        console.error(`Data:`, error.response.data);
      } else {
        console.error(error.message);
      }
      
      // Check if API key is set
      if (process.env.OPENAI_API_KEY) {
        console.log('✅ OPENAI_API_KEY is set');
      } else {
        console.log('❌ OPENAI_API_KEY is not set. Please add it to your .env file');
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
runTest();