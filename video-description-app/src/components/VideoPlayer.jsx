import { useRef, useEffect } from 'react'

const VideoPlayer = ({ videoUrl, scriptText, voiceSettings }) => {
  const videoRef = useRef(null)
  const utteranceRef = useRef(null)

  // Function to handle text-to-speech
  const speak = (text) => {
    if (!text) return
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel()
    
    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(text)
    utteranceRef.current = utterance
    
    // Apply voice settings if available
    if (voiceSettings) {
      if (voiceSettings.voice) utterance.voice = voiceSettings.voice
      if (voiceSettings.rate) utterance.rate = voiceSettings.rate
      if (voiceSettings.pitch) utterance.pitch = voiceSettings.pitch
    }
    
    // Speak the text
    window.speechSynthesis.speak(utterance)
  }

  // Clean up speech synthesis when component unmounts
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel()
    }
  }, [])

  return (
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
        onPlay={() => {
          if (scriptText) speak(scriptText)
        }}
        onPause={() => window.speechSynthesis.pause()}
        onEnded={() => window.speechSynthesis.cancel()}
        aria-label="Video player"
      />
    </div>
  )
}

export default VideoPlayer