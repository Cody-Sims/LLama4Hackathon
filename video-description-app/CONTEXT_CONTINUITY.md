# Maintaining Context and Continuity Between Video Chunks

This document explains how the application maintains context and continuity between video chunks to create a coherent narrative.

## Overview

When processing longer videos in chunks, it's important that each chunk's description builds on the previous ones to create a continuous narrative. This document explains the approach used to maintain context between chunks.

## Implementation

### 1. Context Storage

The application maintains a cache of previous descriptions using a simple object:

```javascript
// Store previous descriptions to maintain context between chunks
const previousDescriptions = {};
```

Each description is stored with a key based on its chunk index, allowing future chunks to access the description of the previous chunk.

### 2. Context Passing

When processing a new chunk, the application:

1. Retrieves the previous chunk's description
2. Includes this description in the prompt to the AI model
3. Explicitly instructs the model to continue the narrative without repeating information

```javascript
if (previousDescription) {
  additionalText += `\n\nPrevious chunk description: "${previousDescription}"\n\nContinue the narrative from where the previous description left off. Do not repeat information. Focus on what happens next in the video.`;
}
```

### 3. System Message

The system message is also adjusted based on whether there's a previous description:

```javascript
const system = previousDescription 
  ? "Continue the narrative from the previous description. Be concise (under 25 words) and avoid repetition."
  : "Provide a concise description (under 25 words) of what's happening in the video.";
```

### 4. Prompt Design

The main prompt emphasizes continuity and narrative flow:

```
Focus on creating a continuous narrative that flows naturally from one segment to the next. 
Each segment should build on the previous one without repeating information.
```

## Benefits

This approach provides several benefits:

1. **Coherent Narrative**: The descriptions form a continuous story rather than disconnected observations
2. **Reduced Redundancy**: By explicitly instructing the model not to repeat information, we avoid redundancy
3. **Efficient Use of Words**: With only 25 words per chunk, avoiding repetition allows more new information to be conveyed
4. **Natural Flow**: The narrative flows more naturally from one chunk to the next

## Example

For a video showing someone walking into a room, sitting down, and then reading a book:

- Chunk 1: "A person enters a well-lit room with modern furniture."
- Chunk 2: "They sit down on the blue couch and reach for something on the coffee table."
- Chunk 3: "Opening a hardcover book, they begin reading intently, occasionally turning pages."

Notice how each description builds on the previous one without repeating information about the room or the person.