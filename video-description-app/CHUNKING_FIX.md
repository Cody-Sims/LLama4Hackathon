# Video Chunking Fix

This document explains the changes made to fix the video chunking issue in the Video Description App.

## Problem

The frontend was sending the entire video for each chunk, causing the backend to process the entire video multiple times instead of just the specified chunk. This was inefficient and resulted in duplicate processing.

## Solution

We made several changes to fix this issue:

### 1. Frontend Changes

#### VideoChunker.js

- Modified `createVideoChunk` to create a new blob with metadata for each chunk
- Updated `splitVideoIntoChunks` to use the new `createVideoChunk` function
- Added proper time range tracking for each chunk

### 2. Backend Changes

#### extractFrames Function

- Modified to accept `startTime` and `endTime` parameters
- Updated to only extract frames within the specified time range
- Changed the frame naming to be relative to the chunk start time

#### extractAudio Function

- Modified to accept `startTime` and `duration` parameters
- Updated to only extract audio within the specified time range
- Added proper seeking and duration limiting using FFmpeg

#### /api/process-chunk Endpoint

- Updated to pass the `startTime` and `endTime` to the extraction functions
- Added logging for chunk duration and time range

#### generateVideoDescription Function

- Simplified to handle a single chunk at a time
- Modified to accept `startTime` and `endTime` parameters
- Updated to format the description with the correct timestamps

## Result

With these changes, the backend now processes only the specified chunk of the video, rather than the entire video for each chunk. This results in:

1. Faster processing for each chunk
2. Less resource usage on the backend
3. More accurate descriptions for each chunk
4. Proper timestamps in the generated descriptions

## Technical Notes

- The frontend still sends the entire video blob for each chunk, but includes metadata about the time range
- The backend uses FFmpeg's seeking and duration limiting to extract only the relevant portion of the video
- Each chunk is processed independently, with no context from previous chunks
- Descriptions are limited to 25 words or less to ensure they can be spoken within the 9-second chunk