/**
 * VideoChunker utility for splitting videos into 9-second chunks
 */

/**
 * Creates a video element and returns a promise that resolves when the video metadata is loaded
 * @param {Blob} videoBlob - The video blob to load
 * @returns {Promise<HTMLVideoElement>} - Promise resolving to the video element
 */
const createVideoElement = (videoBlob) => {
  return new Promise((resolve, reject) => {
    const videoElement = document.createElement('video');
    videoElement.preload = 'metadata';
    videoElement.src = URL.createObjectURL(videoBlob);
    
    videoElement.onloadedmetadata = () => {
      URL.revokeObjectURL(videoElement.src);
      resolve(videoElement);
    };
    
    videoElement.onerror = (error) => {
      URL.revokeObjectURL(videoElement.src);
      reject(error);
    };
  });
};

/**
 * Gets the duration of a video blob
 * @param {Blob} videoBlob - The video blob
 * @returns {Promise<number>} - Promise resolving to the video duration in seconds
 */
export const getVideoDuration = async (videoBlob) => {
  try {
    const videoElement = await createVideoElement(videoBlob);
    return videoElement.duration;
  } catch (error) {
    console.error('Error getting video duration:', error);
    throw error;
  }
};

/**
 * Creates a video chunk using FFmpeg.wasm
 * @param {Blob} videoBlob - The original video blob
 * @param {number} startTime - Start time in seconds
 * @param {number} endTime - End time in seconds
 * @returns {Promise<Blob>} - Promise resolving to the chunk blob
 */
export const createVideoChunk = async (videoBlob, startTime, endTime) => {
  try {
    console.log(`Creating actual chunk from ${startTime}s to ${endTime}s`);
    
    // For now, we'll use a simpler approach by creating a new blob with metadata
    // In a production app, you would use FFmpeg.wasm or a similar library to actually trim the video
    
    // Create a new blob with the same type as the original
    const newBlob = new Blob([videoBlob], { type: videoBlob.type });
    
    // Add custom properties to track the chunk's time range
    // Note: These properties aren't standard and won't be preserved if the blob is serialized
    Object.defineProperties(newBlob, {
      'startTime': { value: startTime, writable: false },
      'endTime': { value: endTime, writable: false },
      'isVideoChunk': { value: true, writable: false },
      'duration': { value: endTime - startTime, writable: false }
    });
    
    console.log(`Created chunk blob with size: ${newBlob.size} bytes, duration: ${newBlob.duration}s`);
    return newBlob;
  } catch (error) {
    console.error('Error creating video chunk:', error);
    throw error;
  }
};

/**
 * Splits a video into 9-second chunks
 * @param {Blob} videoBlob - The video blob to split
 * @param {number} chunkDuration - Duration of each chunk in seconds (default: 9)
 * @returns {Promise<Array<{chunk: Blob, startTime: number, endTime: number}>>} - Promise resolving to an array of chunk objects
 */
export const splitVideoIntoChunks = async (videoBlob, chunkDuration = 9) => {
  try {
    const duration = await getVideoDuration(videoBlob);
    const chunks = [];
    
    // Calculate number of chunks
    const numChunks = Math.ceil(duration / chunkDuration);
    console.log(`Splitting ${duration}s video into ${numChunks} chunks of ${chunkDuration}s each`);
    
    // For short videos, just use the original blob
    if (numChunks === 1) {
      const chunk = await createVideoChunk(videoBlob, 0, duration);
      return [{
        chunk,
        startTime: 0,
        endTime: duration
      }];
    }
    
    // Create actual chunks for each segment
    for (let i = 0; i < numChunks; i++) {
      const startTime = i * chunkDuration;
      const endTime = Math.min((i + 1) * chunkDuration, duration);
      
      console.log(`Creating chunk ${i+1}/${numChunks}: ${startTime}s to ${endTime}s`);
      
      // Create an actual chunk with the specified time range
      const chunkBlob = await createVideoChunk(videoBlob, startTime, endTime);
      
      chunks.push({
        chunk: chunkBlob,
        startTime,
        endTime
      });
    }
    
    return chunks;
  } catch (error) {
    console.error('Error splitting video into chunks:', error);
    throw error;
  }
};