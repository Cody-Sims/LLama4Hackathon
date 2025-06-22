import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default configuration
const defaultConfig = {
  url: "https://api.llama.com/v1/chat/completions",
  api_key: process.env.LLAMA_API_KEY || "LLM|1354480252284946|bjdPaQpBbdb3tvhmMakySIe-kgA"
};

// Load config from file if exists, otherwise use default
let config;
try {
  const configPath = path.join(__dirname, 'config.json');
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } else {
    config = defaultConfig;
  }
} catch (error) {
  console.error('Error loading config:', error);
  config = defaultConfig;
}

/**
 * Post to Llama API for inference
 * @param {string} model - The model name
 * @param {string} system - The system prompt
 * @param {Array} content - The content array with text and images
 * @param {number} max_tokens - Maximum tokens to generate
 * @param {number} temperature - Temperature for generation
 * @returns {Promise<string>} - The generated text
 */
export async function post2inference(model, system, content, max_tokens = 256, temperature = 0.1) {
  const url = config.url;
  const API_KEY = config.api_key;
  
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${API_KEY}`
  };
  
  // Add a reminder about the word limit to the system prompt
  const enhancedSystem = system + "\n\nREMINDER: Your response MUST be 25 words or less. This is a hard requirement.";
  
  const postjson = {
    "model": model,
    "max_tokens": max_tokens,
    "temperature": temperature,
    "messages": [
      {
        "role": "user",
        "system": enhancedSystem,
        "content": content
      }
    ]
  };
  
  try {
    const res = await axios.post(url, postjson, { headers });
    if (res.status === 200) {
      console.log(`API call successful with status code: ${res.status}`);
      return res.data.completion_message.content.text;
    } else {
      console.error(`API call failed with status code: ${res.status}`);
      console.error(res.data);
      return "";
    }
  } catch (error) {
    console.error('Error calling Llama API:', error.message);
    if (error.response) {
      console.error('API response error:', error.response.data);
    }
    return "";
  }
}

/**
 * Convert binary image data to base64
 * @param {Buffer} buffer - The binary image data
 * @returns {string} - Base64 encoded image
 */
export function binary2base64(buffer) {
  return buffer.toString('base64');
}

/**
 * Process video frames for Llama API
 * @param {Array} framesPaths - Array of paths to extracted frames
 * @param {string} language - The language code for the description
 * @returns {Array} - Array of content objects for Llama API
 */
export async function processVideoFrames(framesPaths, language = 'en') {
  const contentArray = [];
  
  // Get the language name for the prompt
  const languageName = LANGUAGE_NAMES[language] || 'the same language as the transcript';
  
  // Add text prefix with focus on continuity, brevity, and language
  contentArray.push({
    type: "text",
    text: `You are an accessibility assistant describing a video for vision-impaired users. Your description must be under 25 words and will be played alongside the video.\n\nIMPORTANT: Generate your description in ${languageName}. Your entire response should be in ${languageName} only.\n\nFocus on creating a continuous narrative that flows naturally from one segment to the next. Each segment should build on the previous one without repeating information.\n\nDescribe the attached photos and transcribed audio in a concise, storytelling tone. Process the images in order and focus on what's happening in this specific segment of the video.\n\nKeep your description under 25 words while maintaining clarity and continuity.`
  });
  
  // Add frames as image_url objects - limit to max 9 frames (1 per second for a 9-second segment)
  const maxFrames = 9;
  const totalFrames = framesPaths.length;
  
  // If we have more than maxFrames, select frames evenly distributed throughout the segment
  let selectedFrames = framesPaths;
  if (totalFrames > maxFrames) {
    console.log(`Segment has ${totalFrames} frames, selecting ${maxFrames} evenly distributed frames`);
    selectedFrames = [];
    const step = totalFrames / maxFrames;
    
    for (let i = 0; i < maxFrames; i++) {
      const index = Math.min(Math.floor(i * step), totalFrames - 1);
      selectedFrames.push(framesPaths[index]);
    }
  }
  
  // Process the selected frames
  for (const framePath of selectedFrames) {
    try {
      const data = await fs.promises.readFile(framePath);
      const base64Image = binary2base64(data);
      contentArray.push({
        type: "image_url",
        image_url: {
          url: `data:image/png;base64,${base64Image}`
        }
      });
    } catch (error) {
      console.error(`Error processing frame ${framePath}:`, error);
    }
  }
  
  return contentArray;
}

/**
 * Split frames into segments for processing
 * @param {Array} framesPaths - Array of paths to extracted frames
 * @param {number} segmentSize - Number of frames per segment
 * @returns {Array} - Array of frame path segments
 */
export function splitFramesIntoSegments(framesPaths, segmentSize = 9) {
  const segments = [];
  for (let i = 0; i < framesPaths.length; i += segmentSize) {
    segments.push(framesPaths.slice(i, i + segmentSize));
  }
  return segments;
}

/**
 * Count words in a string
 * @param {string} text - The text to count words in
 * @returns {number} - The number of words
 */
function countWords(text) {
  return text.trim().split(/\s+/).length;
}

/**
 * Clean up the description by removing any explanations or meta-text
 * @param {string} text - The text to clean up
 * @returns {string} - The cleaned up text
 */
function cleanupDescription(text) {
  if (!text) return "";
  
  // Remove any text that looks like explanations or meta-text
  let cleaned = text;
  
  // Remove phrases like "Here's a description in 25 words or less:"
  cleaned = cleaned.replace(/^(Here('s| is) a description( in \d+ words or less)?:)/i, "");
  
  // Remove phrases like "25 words:"
  cleaned = cleaned.replace(/^(\d+ words:)/i, "");
  
  // Remove any text in parentheses (often explanations)
  cleaned = cleaned.replace(/\([^)]*\)/g, "");
  
  // Remove any text in brackets
  cleaned = cleaned.replace(/\[[^\]]*\]/g, "");
  
  // Remove any text that starts with "Note:" or similar
  cleaned = cleaned.replace(/^Note:.*$/im, "");
  
  // Remove any text that mentions word count
  cleaned = cleaned.replace(/^.*\b\d+\s+words?\b.*$/im, "");
  
  // Remove any text after a line with "---" or "===" (often separators)
  cleaned = cleaned.replace(/^(.*?)(\-\-\-|\=\=\=).*$/s, "$1");
  
  // Remove any lines that are just numbers (often word counts)
  cleaned = cleaned.replace(/^\d+$/gm, "");
  
  // Trim and remove extra whitespace
  cleaned = cleaned.trim().replace(/\s+/g, " ");
  
  return cleaned;
}

// Store previous descriptions to maintain context between chunks
const previousDescriptions = {};

// Language names for prompting
const LANGUAGE_NAMES = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'nl': 'Dutch',
  'ru': 'Russian',
  'zh': 'Chinese',
  'ja': 'Japanese',
  'ko': 'Korean',
  'ar': 'Arabic',
  'hi': 'Hindi'
};

/**
 * Generate video description using Llama API with segmentation for longer videos
 * @param {string} transcript - The video transcript
 * @param {Array} framesPaths - Array of paths to extracted frames
 * @param {number} startTime - Start time of the chunk in seconds
 * @param {number} endTime - End time of the chunk in seconds
 * @param {string} language - The language code for the description (default: 'en')
 * @returns {Promise<string>} - The generated description
 */
export async function generateVideoDescription(transcript, framesPaths, startTime = 0, endTime = null, language = 'en') {
  try {
    // This is a single chunk - process all frames at once
    console.log(`Processing video chunk with ${framesPaths.length} frames (${startTime}s to ${endTime || 'end'}) in ${LANGUAGE_NAMES[language] || language}`);
    const contentArray = await processVideoFrames(framesPaths, language);
    
    // Get the previous chunk's description to maintain context
    const previousChunkKey = Math.floor(startTime / 9) - 1;
    const previousDescription = previousChunkKey >= 0 ? previousDescriptions[previousChunkKey] : null;
    
    // Add transcript and previous description to the first text element
    if (contentArray.length > 0 && contentArray[0].type === "text") {
      let additionalText = "";
      
      if (transcript) {
        additionalText += `\nHere is the transcript from the video chunk: ${transcript}`;
      }
      
      if (previousDescription) {
        additionalText += `\n\nPrevious chunk description: "${previousDescription}"\n\nContinue the narrative from where the previous description left off. Do not repeat information. Focus on what happens next in the video.`;
      }
      
      contentArray[0].text += additionalText;
    }
    
    // Call Llama API with Llama 4 model
    const model = "Llama-4-Maverick-17B-128E-Instruct-FP8";
    
    // Get the language name for the system message
    const languageName = LANGUAGE_NAMES[language] || 'the same language as the transcript';
    
    // System message that emphasizes continuity, brevity, and language
    const system = previousDescription 
      ? `Continue the narrative from the previous description. Be concise (under 25 words) and avoid repetition. Generate your response in ${languageName} only.`
      : `Provide a concise description (under 25 words) of what's happening in the video. Generate your response in ${languageName} only.`;
    
    // Try up to 3 times to get a good response
    let description = "";
    let attempts = 0;
    const maxAttempts = 3;
    const MAX_WORDS = 25;
    
    while (attempts < maxAttempts) {
      attempts++;
      // Adjust parameters to encourage brevity
      const temperature = 0.3 + (attempts * 0.1); // Increase temperature with each attempt
      const max_tokens = 100; // Limit tokens to encourage brevity
      
      description = await post2inference(model, system, contentArray, max_tokens, temperature);
      
      // Clean up the description - remove any explanations or meta-text
      description = cleanupDescription(description);
      
      const wordCount = countWords(description);
      if (wordCount <= MAX_WORDS) {
        console.log(`Got description with ${wordCount} words on attempt ${attempts}: "${description}"`);
        break;
      } else {
        console.log(`Description too long (${wordCount} words), retrying (attempt ${attempts}/${maxAttempts}): "${description}"`);
      }
    }
    
    // Store this description for context in future chunks
    const currentChunkKey = Math.floor(startTime / 9);
    previousDescriptions[currentChunkKey] = description;
    
    // Store metadata separately instead of embedding timestamps in the text
    const result = {
      text: description,
      startTime: startTime,
      endTime: endTime || startTime + framesPaths.length,
      timestamp: new Date().toISOString()
    };
    
    // Save the result to a file for debugging
    const requestGuid = Date.now().toString();
    const recordDir = path.join(__dirname, 'data', 'record');
    if (!fs.existsSync(recordDir)) {
      fs.mkdirSync(recordDir, { recursive: true });
    }
    fs.writeFileSync(path.join(recordDir, `${requestGuid}.txt`), JSON.stringify(result, null, 2));
    
    return description;
  } catch (error) {
    console.error('Error generating video description:', error);
    return "";
  }
}