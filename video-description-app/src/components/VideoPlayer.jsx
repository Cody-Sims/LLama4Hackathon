import { useRef, useEffect, useState } from 'react'

const VideoPlayer = ({ videoUrl, scriptText, voiceSettings, processedChunks = [] }) => {
  const videoRef = useRef(null)
  const utteranceRef = useRef(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [currentChunkText, setCurrentChunkText] = useState('')
  
  // Parse the timestamped script text into segments
  const parseScriptSegments = (text) => {
    if (!text) return [];
    
    const segments = [];
    const regex = /\[(\d+)s-(\d+)s\] (.*?)(?=\n\n|\n$|$)/gs;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      segments.push({
        startTime: parseFloat(match[1]),
        endTime: parseFloat(match[2]),
        text: match[3].trim()
      });
    }
    
    return segments;
  };
  
  const scriptSegments = parseScriptSegments(scriptText);
  
  // Function to handle text-to-speech
  const speak = (text) => {
    if (!text) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
    
    // Apply voice settings if available
    if (voiceSettings) {
      if (voiceSettings.voice) utterance.voice = voiceSettings.voice;
      if (voiceSettings.rate) utterance.rate = voiceSettings.rate;
      if (voiceSettings.pitch) utterance.pitch = voiceSettings.pitch;
    }
    
    // Speak the text
    window.speechSynthesis.speak(utterance);
  };
  
  // Function to find the appropriate segment for the current time
  const findSegmentForTime = (time) => {
    return scriptSegments.find(segment => 
      time >= segment.startTime && time < segment.endTime
    );
  };
  
  // Update current time and check for segment changes
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    
    const time = videoRef.current.currentTime;
    setCurrentTime(time);
    
    const segment = findSegmentForTime(time);
    if (segment && segment.text !== currentChunkText) {
      setCurrentChunkText(segment.text);
      speak(segment.text);
    }
  };

  // Clean up speech synthesis when component unmounts
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Effect to update current chunk text when script segments change
  useEffect(() => {
    if (scriptSegments.length > 0 && videoRef.current) {
      const segment = findSegmentForTime(videoRef.current.currentTime);
      if (segment) {
        console.log(`Found segment for time ${videoRef.current.currentTime}:`, segment);
        setCurrentChunkText(segment.text);
      }
    }
  }, [scriptText, scriptSegments]);
  
  // Debug log for script segments
  useEffect(() => {
    console.log('Script segments updated:', scriptSegments);
  }, [scriptSegments]);

  return (
    <div style={{ 
      width: '100%', 
      position: 'relative',
      borderRadius: '0.5rem', 
      overflow: 'hidden',
    }}>
      <div style={{ 
        width: '100%', 
        backgroundColor: 'black', 
        borderRadius: '0.5rem', 
        overflow: 'hidden',
        aspectRatio: '16/9'
      }}>
        <video
          ref={videoRef}
          src={videoUrl}
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'contain' 
          }}
          controls
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => {
            const segment = findSegmentForTime(videoRef.current.currentTime);
            if (segment) {
              setCurrentChunkText(segment.text);
              speak(segment.text);
            } else if (scriptText && !scriptSegments.length) {
              // Legacy mode - speak the entire script
              speak(scriptText);
            }
          }}
          onPause={() => window.speechSynthesis.pause()}
          onEnded={() => window.speechSynthesis.cancel()}
          aria-label="Video player"
        />
      </div>
      
      {/* Current chunk display */}
      {currentChunkText && (
        <div style={{
          position: 'absolute',
          bottom: '4rem',
          left: '0',
          right: '0',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '0.5rem 1rem',
          textAlign: 'center',
          fontSize: '1.2rem',
          fontWeight: '500',
          zIndex: 10
        }}>
          {currentChunkText}
        </div>
      )}
      
      {/* Progress indicator for chunks */}
      {scriptSegments.length > 0 && (
        <div style={{
          display: 'flex',
          marginTop: '0.5rem',
          width: '100%',
          height: '0.5rem',
          backgroundColor: '#e2e8f0',
          borderRadius: '0.25rem',
          overflow: 'hidden'
        }}>
          {scriptSegments.map((segment, index) => (
            <div 
              key={index}
              style={{
                flex: segment.endTime - segment.startTime,
                height: '100%',
                backgroundColor: currentTime >= segment.startTime && currentTime < segment.endTime 
                  ? '#3b82f6' 
                  : currentTime >= segment.endTime 
                    ? '#93c5fd' 
                    : '#e2e8f0',
                transition: 'background-color 0.3s ease'
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default VideoPlayer