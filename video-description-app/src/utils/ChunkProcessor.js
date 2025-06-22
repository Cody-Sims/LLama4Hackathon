/**
 * ChunkProcessor utility for managing the processing of video chunks
 */

/**
 * Process a single video chunk
 * @param {Blob} chunkBlob - The video chunk blob
 * @param {number} startTime - Start time in seconds
 * @param {number} endTime - End time in seconds
 * @param {string} backendUrl - The backend URL
 * @returns {Promise<{success: boolean, script: string, startTime: number, endTime: number}>} - Promise resolving to the chunk processing result
 */
export const processChunk = async (chunkBlob, startTime, endTime, backendUrl) => {
  // Ensure we're enforcing the 25-word limit
  const MAX_WORDS = 25;
  console.log(`Processing chunk [${startTime}s-${endTime}s], size: ${chunkBlob.size} bytes`);
  
  try {
    // Create a FormData object to send the video chunk
    const formData = new FormData();
    formData.append('video', chunkBlob);
    formData.append('startTime', startTime.toString());
    formData.append('endTime', endTime.toString());
    
    // Send the chunk to the backend API
    console.log(`Sending chunk to ${backendUrl}/api/process-chunk`);
    const response = await fetch(`${backendUrl}/api/process-chunk`, {
      method: 'POST',
      body: formData,
    });
    
    // Log the response status
    console.log(`Chunk [${startTime}s-${endTime}s] response status: ${response.status}`);
    
    if (!response.ok) {
      let errorMessage = 'Failed to process video chunk';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        console.error('Error parsing error response:', e);
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log(`Chunk [${startTime}s-${endTime}s] response data:`, data);
    
    if (data.success && data.script) {
      return {
        success: true,
        script: data.script,
        startTime,
        endTime
      };
    } else {
      throw new Error('No description was generated for chunk');
    }
  } catch (error) {
    console.error(`Error processing chunk [${startTime}s-${endTime}s]:`, error);
    return {
      success: false,
      error: error.message,
      startTime,
      endTime
    };
  }
};

/**
 * ChunkProcessor class for managing the processing of video chunks
 */
export class ChunkProcessor {
  constructor(backendUrl) {
    this.backendUrl = backendUrl || 'http://localhost:3001';
    this.queue = [];
    this.processing = false;
    this.results = [];
    this.onProgressCallback = null;
    this.onCompleteCallback = null;
    this.onChunkProcessedCallback = null;
    this.currentChunkIndex = -1;
  }
  
  /**
   * Set callback for progress updates
   * @param {Function} callback - The progress callback function
   */
  onProgress(callback) {
    this.onProgressCallback = callback;
  }
  
  /**
   * Set callback for when all chunks are processed
   * @param {Function} callback - The complete callback function
   */
  onComplete(callback) {
    this.onCompleteCallback = callback;
  }
  
  /**
   * Set callback for when a single chunk is processed
   * @param {Function} callback - The chunk processed callback function
   */
  onChunkProcessed(callback) {
    this.onChunkProcessedCallback = callback;
  }
  
  /**
   * Add chunks to the processing queue
   * @param {Array<{chunk: Blob, startTime: number, endTime: number}>} chunks - The chunks to add
   */
  addChunks(chunks) {
    this.queue.push(...chunks);
    this.results = new Array(this.queue.length).fill(null);
    
    // Start processing if not already processing
    if (!this.processing) {
      this.processNextChunk();
    }
  }
  
  /**
   * Process the next chunk in the queue
   */
  async processNextChunk() {
    if (this.queue.length === 0) {
      this.processing = false;
      
      // Final progress update - 100%
      if (this.onProgressCallback) {
        this.onProgressCallback(100);
      }
      
      if (this.onCompleteCallback) {
        this.onCompleteCallback(this.results);
      }
      
      return;
    }
    
    this.processing = true;
    this.currentChunkIndex++;
    
    const chunk = this.queue.shift();
    const totalChunks = this.currentChunkIndex + this.queue.length + 1; // +1 for the current chunk
    
    try {
      // Update progress before processing
      if (this.onProgressCallback) {
        // Calculate progress based on how many chunks have been processed out of the total
        const progress = (this.currentChunkIndex / totalChunks) * 100;
        console.log(`Processing chunk ${this.currentChunkIndex + 1}/${totalChunks}, progress: ${progress.toFixed(1)}%`);
        this.onProgressCallback(progress);
      }
      
      // Process the chunk
      const result = await processChunk(
        chunk.chunk,
        chunk.startTime,
        chunk.endTime,
        this.backendUrl
      );
      
      // Store the result
      this.results[this.currentChunkIndex] = result;
      
      // Update progress after processing
      if (this.onProgressCallback) {
        const progress = ((this.currentChunkIndex + 1) / totalChunks) * 100;
        console.log(`Completed chunk ${this.currentChunkIndex + 1}/${totalChunks}, progress: ${progress.toFixed(1)}%`);
        this.onProgressCallback(progress);
      }
      
      // Notify that a chunk was processed
      if (this.onChunkProcessedCallback) {
        this.onChunkProcessedCallback(result, this.currentChunkIndex);
      }
    } catch (error) {
      console.error('Error in chunk processing:', error);
      
      // Store the error result
      this.results[this.currentChunkIndex] = {
        success: false,
        error: error.message,
        startTime: chunk.startTime,
        endTime: chunk.endTime
      };
      
      // Notify that a chunk was processed with an error
      if (this.onChunkProcessedCallback) {
        this.onChunkProcessedCallback(this.results[this.currentChunkIndex], this.currentChunkIndex);
      }
      
      // Update progress even if there was an error
      if (this.onProgressCallback) {
        const progress = ((this.currentChunkIndex + 1) / totalChunks) * 100;
        console.log(`Chunk ${this.currentChunkIndex + 1}/${totalChunks} failed, progress: ${progress.toFixed(1)}%`);
        this.onProgressCallback(progress);
      }
    }
    
    // Process the next chunk
    setTimeout(() => this.processNextChunk(), 0); // Use setTimeout to prevent call stack overflow
  }
  
  /**
   * Get all processed results
   * @returns {Array} - The processed results
   */
  getResults() {
    return this.results.filter(result => result !== null);
  }
  
  /**
   * Check if processing is complete
   * @returns {boolean} - True if all chunks have been processed
   */
  isComplete() {
    return !this.processing && this.queue.length === 0;
  }
  
  /**
   * Get the combined script from all processed chunks
   * @returns {string} - The combined script
   */
  getCombinedScript() {
    return this.results
      .filter(result => result && result.success)
      .map(result => `[${result.startTime}s-${result.endTime}s] ${result.script}`)
      .join('\n\n');
  }
}