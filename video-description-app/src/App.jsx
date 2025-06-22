import { useState, useEffect, useRef } from 'react'
import './App.css'

// Component imports
import VideoUploader from './components/VideoUploader'
import VideoPlayer from './components/VideoPlayer'
import DescriptionPanel from './components/DescriptionPanel'
import ControlBar from './components/ControlBar'
import VoiceCustomization from './components/VoiceCustomization'

// Utility imports
import { splitVideoIntoChunks } from './utils/VideoChunker'
import { ChunkProcessor } from './utils/ChunkProcessor'

function App() {
  // State for managing the video file and its URL
  const [videoFile, setVideoFile] = useState(null)
  const [videoUrl, setVideoUrl] = useState(null)
  
  // State for managing the description
  const [scriptText, setScriptText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [detectedLanguage, setDetectedLanguage] = useState('en') // Default to English
  const [hasDetectedLanguage, setHasDetectedLanguage] = useState(false) // Track if language was detected from content
  
  // State for voice customization
  const [voiceSettings, setVoiceSettings] = useState({
    voice: null,
    rate: 1,
    pitch: 1
  })
  
  // State for chunk processing
  const [chunks, setChunks] = useState([])
  const [processedChunks, setProcessedChunks] = useState([])
  const [processingProgress, setProcessingProgress] = useState(0)
  const [currentChunkIndex, setCurrentChunkIndex] = useState(-1)
  
  // Refs
  const chunkProcessorRef = useRef(null)

  // Handle file upload
  const handleFileUpload = async (file) => {
    try {
      setVideoFile(file)
      setVideoUrl(URL.createObjectURL(file))
      setScriptText('')
      setError(null)
      setChunks([])
      setProcessedChunks([])
      setProcessingProgress(0)
      setCurrentChunkIndex(-1)
      setDetectedLanguage('en') // Reset to default language
      setHasDetectedLanguage(false) // Reset language detection flag
      
      // Split the video into chunks
      const videoChunks = await splitVideoIntoChunks(file);
      setChunks(videoChunks);
      console.log(`Video split into ${videoChunks.length} chunks`);
    } catch (error) {
      console.error('Error handling file upload:', error);
      setError('Error processing video: ' + error.message);
    }
  }

  // Test backend connection
  const testBackendConnection = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
      const response = await fetch(`${backendUrl}/api/test`)
      if (response.ok) {
        return true
      }
      return false
    } catch (err) {
      console.error('Backend connection test failed:', err)
      return false
    }
  }

  // Process video chunks in parallel
  const processChunks = async () => {
    if (!videoFile || chunks.length === 0) return;
    
    setIsGenerating(true);
    setError(null);
    setProcessedChunks([]);
    setProcessingProgress(0); // Reset progress
    
    try {
      // Test backend connection first
      const isBackendAvailable = await testBackendConnection();
      if (!isBackendAvailable) {
        throw new Error('Cannot connect to backend server. Please make sure it is running.');
      }
      
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      
      // Initialize the chunk processor
      const processor = new ChunkProcessor(backendUrl);
      chunkProcessorRef.current = processor;
      
      // Set up callbacks
      processor.onProgress((progress) => {
        console.log(`Progress update: ${progress.toFixed(1)}%`);
        setProcessingProgress(progress);
      });
      
      processor.onChunkProcessed((result, index) => {
        console.log(`Chunk ${index} processed:`, result);
        
        setProcessedChunks((prev) => {
          // Create a new array with the correct length if needed
          const newChunks = prev.length >= index + 1 ? [...prev] : new Array(index + 1).fill(null);
          newChunks[index] = result;
          return newChunks;
        });
        
        // Update the script text with all processed chunks
        if (result && result.success) {
          // Get all successful chunks
          const allChunks = chunkProcessorRef.current.getResults()
            .filter(r => r && r.success)
            .map(r => r.script);
          
          // Join all chunks with newlines
          const combinedScript = allChunks.join('\n\n');
          console.log('Updated script:', combinedScript);
          setScriptText(combinedScript);
          
          // Check if we have language metadata and update the detected language
          if (result.metadata && result.metadata.language) {
            console.log(`Detected language from backend: ${result.metadata.language}`);
            
            // Only update if we haven't already detected a non-English language
            // or if this is a new non-English language
            if (!hasDetectedLanguage || 
                (result.metadata.language !== 'en' && detectedLanguage === 'en')) {
              setDetectedLanguage(result.metadata.language);
              setHasDetectedLanguage(true);
              console.log(`Updated detected language to: ${result.metadata.language}`);
            } else {
              console.log(`Keeping existing detected language: ${detectedLanguage}`);
            }
          }
        }
      });
      
      processor.onComplete((results) => {
        setIsGenerating(false);
        setProcessingProgress(100); // Ensure progress is 100% when complete
        console.log('All chunks processed:', results);
      });
      
      // Add chunks to the processor
      console.log(`Adding ${chunks.length} chunks to processor`);
      processor.addChunks(chunks);
      
    } catch (err) {
      console.error('Error processing video chunks:', err);
      setError('Failed to process video: ' + err.message);
      setIsGenerating(false);
    }
  };
  
  // Legacy method - Generate description using AI (all at once)
  const generateDescription = async () => {
    if (chunks.length > 0) {
      // Use the new chunk-based processing
      await processChunks();
      return;
    }
    
    // Fall back to the old method if chunking failed
    if (!videoFile) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      // Test backend connection first
      const isBackendAvailable = await testBackendConnection();
      if (!isBackendAvailable) {
        throw new Error('Cannot connect to backend server. Please make sure it is running.');
      }
      
      // Create a FormData object to send the video file
      const formData = new FormData();
      formData.append('video', videoFile);
      
      // Send the video to our backend API
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/process-video`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process video');
      }
      
      const data = await response.json();
      
      if (data.success && data.script) {
        setScriptText(data.script);
        
        // Check if we have language metadata and update the detected language
        if (data.metadata && data.metadata.language) {
          console.log(`Detected language from backend: ${data.metadata.language}`);
          
          // Only update if it's a non-English language or we haven't detected a language yet
          if (data.metadata.language !== 'en' || !hasDetectedLanguage) {
            setDetectedLanguage(data.metadata.language);
            setHasDetectedLanguage(true);
            console.log(`Updated detected language to: ${data.metadata.language}`);
          } else {
            console.log(`Keeping existing detected language: ${detectedLanguage}`);
          }
        }
      } else {
        throw new Error('No description was generated');
      }
    } catch (err) {
      console.error('Error generating description:', err);
      setError('Failed to generate description: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      padding: '0',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      color: '#334155'
    }}>
      {/* Navigation Bar */}
      <nav style={{
        backgroundColor: '#1e40af',
        color: 'white',
        padding: '1rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              style={{ width: '2rem', height: '2rem', marginRight: '0.75rem' }}
            >
              <path d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16zm0-2A6 6 0 1 0 8 2a6 6 0 0 0 0 12zm1-6h2v4H7V6h2v2z"/>
            </svg>
            <h1 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '700', 
              margin: '0'
            }}>
              Video Description Generator
            </h1>
          </div>
          <div>
            <a 
              href="https://github.com/Cody-Sims/LLama4Hackathon" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                color: 'white', 
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="currentColor"
                style={{ marginRight: '0.5rem' }}
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </nav>
      
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        padding: '2rem 1rem'
      }}>
        <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <p style={{ 
            fontSize: '1.125rem', 
            color: '#64748b',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            Create accessible videos by generating audio descriptions for visually impaired viewers using AI
          </p>
        </header>
        
        <main>
          {!videoUrl ? (
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '0.75rem', 
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              padding: '2rem',
              maxWidth: '800px',
              margin: '0 auto'
            }}>
              <VideoUploader onFileUpload={handleFileUpload} />
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(12, 1fr)',
              gap: '1.5rem'
            }}>
              <div style={{ 
                gridColumn: 'span 8 / span 8',
                '@media (max-width: 1024px)': {
                  gridColumn: 'span 12 / span 12'
                }
              }}>
                <div style={{ 
                  backgroundColor: 'white', 
                  borderRadius: '0.75rem', 
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  padding: '1.5rem',
                  marginBottom: '1.5rem'
                }}>
                  <VideoPlayer 
                    videoUrl={videoUrl} 
                    scriptText={scriptText}
                    voiceSettings={voiceSettings}
                    processedChunks={processedChunks}
                  />
                  
                  {/* Processing progress indicator */}
                  {isGenerating && (
                    <div style={{ marginTop: '1rem' }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        marginBottom: '0.5rem' 
                      }}>
                        <div style={{ 
                          flex: '1', 
                          height: '0.5rem', 
                          backgroundColor: '#e2e8f0', 
                          borderRadius: '0.25rem', 
                          overflow: 'hidden' 
                        }}>
                          <div style={{ 
                            width: `${processingProgress}%`, 
                            height: '100%', 
                            backgroundColor: '#3b82f6', 
                            transition: 'width 0.3s ease' 
                          }} />
                        </div>
                        <span style={{ 
                          marginLeft: '1rem', 
                          fontSize: '0.875rem', 
                          color: '#64748b' 
                        }}>
                          {Math.round(processingProgress)}%
                        </span>
                      </div>
                      <p style={{ 
                        fontSize: '0.875rem', 
                        color: '#64748b', 
                        margin: '0' 
                      }}>
                        Processing video in chunks... You can start watching while descriptions are being generated.
                      </p>
                    </div>
                  )}
                  <ControlBar 
                    onGenerateDescription={generateDescription} 
                    isGenerating={isGenerating}
                    hasDescription={!!scriptText}
                  />
                </div>
              </div>
              
              <div style={{ 
                gridColumn: 'span 4 / span 4',
                '@media (max-width: 1024px)': {
                  gridColumn: 'span 12 / span 12'
                }
              }}>
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '0.75rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  overflow: 'hidden'
                }}>
                  <div style={{ padding: '1.25rem', borderBottom: scriptText ? '1px solid #e2e8f0' : 'none' }}>
                    <DescriptionPanel 
                      scriptText={scriptText} 
                      isGenerating={isGenerating}
                      error={error}
                      processingProgress={processingProgress}
                    />
                  </div>
                  
                  {scriptText && (
                    <div style={{ padding: '1.25rem' }}>
                      <VoiceCustomization 
                        onVoiceChange={setVoiceSettings}
                        scriptText={scriptText}
                        detectedLanguage={detectedLanguage}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
        
        <footer style={{ 
          marginTop: '3rem', 
          textAlign: 'center', 
          color: '#64748b',
          fontSize: '0.875rem',
          borderTop: '1px solid #e2e8f0',
          paddingTop: '1.5rem'
        }}>
          <p>Powered by Llama4 AI - Making videos accessible for everyone</p>
        </footer>
      </div>
    </div>
  )
}

export default App
