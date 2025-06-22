import { useRef, useEffect, useState } from 'react'

const VideoPlayer = ({ videoUrl, scriptText, voiceSettings, processedChunks = [] }) => {
  const videoRef = useRef(null)
  const utteranceRef = useRef(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [currentChunkText, setCurrentChunkText] = useState('')
  
  // Parse the script text into segments based on the format
  const parseScriptSegments = (text) => {
    if (!text) return [];
    
    // First, try to parse as JSON if the text is in JSON format
    try {
      // Check if the text is a JSON array
      if (text.trim().startsWith('[') && text.trim().endsWith(']')) {
        const jsonData = JSON.parse(text);
        return jsonData.map(item => ({
          startTime: item.startTime,
          endTime: item.endTime,
          text: item.text
        }));
      }
    } catch (e) {
      console.log('Not valid JSON array, trying other formats');
    }
    
    // If not JSON, check if we have descriptions separated by newlines
    const segments = [];
    
    // Check if we have timestamps in the format [0s-9s]
    const timestampRegex = /\[(\d+)s-(\d+)s\] (.*?)(?=\n\n|\n$|$)/gs;
    let hasTimestamps = timestampRegex.test(text);
    timestampRegex.lastIndex = 0; // Reset regex state
    
    if (hasTimestamps) {
      // Parse text with timestamps
      let match;
      while ((match = timestampRegex.exec(text)) !== null) {
        segments.push({
          startTime: parseFloat(match[1]),
          endTime: parseFloat(match[2]),
          text: match[3].trim()
        });
      }
    } else {
      // If no timestamps, treat each paragraph as a separate segment
      const paragraphs = text.split(/\n\n|\n/).filter(p => p.trim());
      paragraphs.forEach((paragraph, index) => {
        segments.push({
          startTime: index * 9, // Assume 9-second segments
          endTime: (index + 1) * 9,
          text: paragraph.trim()
        });
      });
    }
    
    return segments;
  };
  
  const scriptSegments = parseScriptSegments(scriptText);
  
  // Function to handle text-to-speech
  const speak = (text, isSegment = false) => {
    if (!text || !isNarrationEnabled) return;
    
    // If this is a segment, make sure we're only speaking the description part, not the timestamps
    let textToSpeak = text;
    if (isSegment) {
      // Remove any timestamp pattern like [0s-9s] from the beginning of the text
      textToSpeak = text.replace(/^\[\d+s-\d+s\]\s*/, '');
    }
    
    console.log(`Speaking text: "${textToSpeak}"`);
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
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

  // State for audio muting and narration
  const [isMuted, setIsMuted] = useState(true);
  const [isNarrationEnabled, setIsNarrationEnabled] = useState(true);

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
          muted={isMuted} // Mute the video by default
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
        
        {/* Audio toggle button */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          style={{
            position: 'absolute',
            bottom: '4.5rem',
            right: '1rem',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '2.5rem',
            height: '2.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 20
          }}
          aria-label={isMuted ? "Unmute original audio" : "Mute original audio"}
          title={isMuted ? "Unmute original audio" : "Mute original audio"}
        >
          {isMuted ? (
            // Muted icon
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
              <line x1="23" y1="9" x2="17" y2="15"></line>
              <line x1="17" y1="9" x2="23" y2="15"></line>
            </svg>
          ) : (
            // Unmuted icon
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            </svg>
          )}
        </button>
        
        {/* Narration toggle button */}
        <button
          onClick={() => {
            setIsNarrationEnabled(!isNarrationEnabled);
            if (!isNarrationEnabled) {
              // If turning narration back on and video is playing, start narration for current segment
              if (videoRef.current && !videoRef.current.paused) {
                const segment = findSegmentForTime(videoRef.current.currentTime);
                if (segment) {
                  speak(segment.text);
                }
              }
            } else {
              // If turning narration off, stop any ongoing speech
              window.speechSynthesis.cancel();
            }
          }}
          style={{
            position: 'absolute',
            bottom: '4.5rem',
            right: '4rem',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '2.5rem',
            height: '2.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 20
          }}
          aria-label={isNarrationEnabled ? "Disable narration" : "Enable narration"}
          title={isNarrationEnabled ? "Disable narration" : "Enable narration"}
        >
          {isNarrationEnabled ? (
            // Narration enabled icon
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="22"></line>
            </svg>
          ) : (
            // Narration disabled icon
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="1" y1="1" x2="23" y2="23"></line>
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6"></path>
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
              <line x1="12" y1="19" x2="12" y2="22"></line>
            </svg>
          )}
        </button>
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