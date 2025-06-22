# Language Adaptation in Video Description App

This document explains how the Video Description App automatically adapts to the language of the video content.

## Overview

The app now detects the language of the transcribed audio and generates descriptions in the same language. This ensures that users receive descriptions in the language they're already listening to, enhancing the accessibility experience.

## Implementation Details

### 1. Language Detection

The backend detects the language of the transcribed audio using a pattern-matching approach:

```javascript
function detectTranscriptLanguage(transcript) {
  // Normalize text for better detection
  const normalizedText = transcript.toLowerCase().trim();
  
  // Common words and patterns for different languages
  const languagePatterns = {
    'en': ['the', 'and', 'is', 'in', 'to', 'it', 'that', 'for', 'you', 'with'],
    'es': ['el', 'la', 'los', 'las', 'y', 'es', 'en', 'que', 'por', 'para'],
    // Additional languages...
  };
  
  // Count matches for each language and find the best match
  // ...
}
```

### 2. Prompt Engineering

Once the language is detected, it's incorporated into the prompts sent to the Llama API:

1. **Main Content Prompt**:
   ```javascript
   `You are an accessibility assistant describing a video for vision-impaired users. Your description must be under 25 words and will be played alongside the video.

   IMPORTANT: Generate your description in ${languageName}. Your entire response should be in ${languageName} only.

   Focus on creating a continuous narrative that flows naturally from one segment to the next...`
   ```

2. **System Message**:
   ```javascript
   `Provide a concise description (under 25 words) of what's happening in the video. Generate your response in ${languageName} only.`
   ```

### 3. Metadata Tracking

The detected language is included in the metadata returned to the frontend:

```javascript
res.json({
  success: true,
  script: generatedDescription,
  startTime,
  endTime,
  metadata: {
    startTime,
    endTime,
    timestamp: new Date().toISOString(),
    language: detectedLanguage
  }
});
```

## Supported Languages

The current implementation supports language detection for:

- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)
- Dutch (nl)
- Russian (ru)
- Chinese (zh)
- Japanese (ja)
- Korean (ko)
- Arabic (ar)
- Hindi (hi)

If the language cannot be confidently detected, the system defaults to English.

## Benefits

This feature provides several benefits:

1. **Improved Accessibility**: Users receive descriptions in the same language as the video content
2. **Seamless Experience**: No language switching or translation is needed
3. **Cultural Relevance**: Descriptions can include culturally relevant references appropriate to the language
4. **Global Usability**: The app becomes more useful for non-English content

## Technical Notes

- The language detection is based on common word patterns and may not be 100% accurate for very short transcripts
- The Llama API's multilingual capabilities are leveraged to generate descriptions in different languages
- The system maintains context between segments in the same language