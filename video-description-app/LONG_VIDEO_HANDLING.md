# Handling Long Videos in the Video Description App

This document explains how the application processes longer videos for generating descriptions that can be played alongside the video.

## Overview

When processing videos longer than 9 seconds, the application breaks them down into 9-second segments, processes each segment individually, and generates a short description (25 words or less) for each segment. This ensures that the descriptions can be played alongside the video without overlapping.

## Implementation Details

### 1. Frame Extraction

- The video is divided into 9-second segments
- One frame is extracted per second
- For videos longer than 9 seconds, this results in multiple segments

### 2. Segmentation Process

The `llama_api.js` file implements the segmentation logic:

- `splitFramesIntoSegments(framesPaths, segmentSize)`: Splits the array of frame paths into segments of the specified size (default: 9)
- `generateVideoDescription(transcript, framesPaths)`: Detects if the video is longer than the segment size and processes accordingly:
  - For short videos (≤ 9 seconds): Processes all frames at once
  - For long videos (> 9 seconds): Processes each segment separately

### 3. Word Count Limitation

Each segment description is limited to 25 words or less to ensure it can be spoken within the 9-second segment:

- The application makes up to 3 attempts to get a description with 25 words or less
- If all attempts fail, the description is truncated to 25 words
- The temperature parameter is increased with each attempt to encourage more concise responses

### 4. Context Preservation

For longer videos, each segment after the first one includes:
- The transcript specific to that segment (the transcript is split proportionally)
- The description generated for the previous segment ONLY (not the entire history)
- Instructions to continue the story for the current 9-second segment

This ensures that the description maintains continuity while focusing on the current segment.

### 5. API Optimization

To avoid overwhelming the Llama API with too many images:
- Each segment is limited to a maximum of 9 frames (1 per second)
- If a segment has more frames, the application selects 9 frames evenly distributed throughout the segment

### 6. Timestamped Output

The final output includes timestamps for each segment description:
- Format: `[startTime-endTime] Description text`
- This makes it easy to align descriptions with the video playback

### 7. Error Handling

The application includes robust error handling:
- If the Llama API call fails for any segment, the application falls back to a mock response
- Temporary files are cleaned up properly even if errors occur

## Usage

No changes are required in how you use the application. The segmentation happens automatically for videos longer than 9 seconds.

## Debugging

For debugging purposes, the application:
- Logs the number of frames extracted
- Logs the detected video duration
- Logs when it's processing a long video in segments
- Logs the word count for each segment description
- Logs when it needs to retry due to descriptions being too long
- Saves the generated description to a file in the `data/record` directory