import { useState, useEffect } from 'react'

const VoiceCustomization = ({ onVoiceChange, scriptText }) => {
  const [voices, setVoices] = useState([])
  const [selectedVoice, setSelectedVoice] = useState(null)
  const [selectedLanguage, setSelectedLanguage] = useState('en') // Default to English
  const [rate, setRate] = useState(1)
  const [pitch, setPitch] = useState(1)
  const [isPlaying, setIsPlaying] = useState(false)
  
  // Load available voices
  useEffect(() => {
    // Function to load voices
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices()
      if (availableVoices.length > 0) {
        setVoices(availableVoices)
        
        // Set default voice (preferably English)
        const defaultVoice = availableVoices.find(voice => voice.lang.startsWith('en')) || availableVoices[0]
        setSelectedVoice(defaultVoice)
        
        // Set default language based on the default voice
        if (defaultVoice) {
          setSelectedLanguage(defaultVoice.lang.split('-')[0])
        }
        
        onVoiceChange({ voice: defaultVoice, rate, pitch })
      }
    }
    
    // Load voices on component mount
    loadVoices()
    
    // Chrome loads voices asynchronously, so we need this event listener
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
    
    return () => {
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = null
      }
    }
  }, [onVoiceChange, rate, pitch])
  
  // Group voices by language
  const voicesByLanguage = voices.reduce((acc, voice) => {
    const lang = voice.lang.split('-')[0] // Get language code (e.g., 'en' from 'en-US')
    if (!acc[lang]) {
      acc[lang] = []
    }
    acc[lang].push(voice)
    return acc
  }, {})
  
  // Get unique languages
  const languages = Object.keys(voicesByLanguage).sort()
  
  // Get voices for the selected language
  const voicesForSelectedLanguage = voicesByLanguage[selectedLanguage] || []
  
  // Handle language change
  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value
    setSelectedLanguage(newLanguage)
    
    // Select the first voice for this language
    if (voicesByLanguage[newLanguage] && voicesByLanguage[newLanguage].length > 0) {
      const newVoice = voicesByLanguage[newLanguage][0]
      setSelectedVoice(newVoice)
      onVoiceChange({ voice: newVoice, rate, pitch })
    }
  }
  
  // Handle voice change
  const handleVoiceChange = (e) => {
    const voice = voices.find(v => v.name === e.target.value)
    setSelectedVoice(voice)
    onVoiceChange({ voice, rate, pitch })
  }
  
  // Handle rate change
  const handleRateChange = (e) => {
    const newRate = parseFloat(e.target.value)
    setRate(newRate)
    onVoiceChange({ voice: selectedVoice, rate: newRate, pitch })
  }
  
  // Handle pitch change
  const handlePitchChange = (e) => {
    const newPitch = parseFloat(e.target.value)
    setPitch(newPitch)
    onVoiceChange({ voice: selectedVoice, rate, pitch: newPitch })
  }
  
  // Preview voice
  const previewVoice = () => {
    if (!scriptText) return
    
    // If already playing, stop
    if (isPlaying) {
      window.speechSynthesis.cancel()
      setIsPlaying(false)
      return
    }
    
    // Create a preview text (either use a short sample or the first sentence of the script)
    const previewText = scriptText 
      ? scriptText.split('.')[0] + '.' 
      : 'This is a preview of the selected voice.';
    
    // Create utterance
    const utterance = new SpeechSynthesisUtterance(previewText)
    
    // Set voice properties
    if (selectedVoice) utterance.voice = selectedVoice
    utterance.rate = rate
    utterance.pitch = pitch
    
    // Add event listener for when speech ends
    utterance.onend = () => setIsPlaying(false)
    
    // Speak
    setIsPlaying(true)
    window.speechSynthesis.cancel() // Cancel any ongoing speech
    window.speechSynthesis.speak(utterance)
  }
  
  // Get language display name
  const getLanguageDisplayName = (langCode) => {
    try {
      return new Intl.DisplayNames([navigator.language], { type: 'language' }).of(langCode)
    } catch (e) {
      console.log('Error getting language display name:', e)
      return langCode
    }
  }
  
  return (
    <div>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '0.75rem'
      }}>
        <h3 style={{ 
          fontSize: '1rem', 
          fontWeight: '600', 
          color: '#334155',
          margin: 0
        }}>
          Voice Settings
        </h3>
        
        <button
          onClick={previewVoice}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.375rem 0.75rem',
            borderRadius: '0.375rem',
            backgroundColor: isPlaying ? '#ef4444' : '#4f46e5',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: '500'
          }}
        >
          {isPlaying ? (
            <>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="12" 
                height="12" 
                fill="currentColor" 
                viewBox="0 0 16 16"
                style={{ marginRight: '0.25rem' }}
              >
                <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"/>
              </svg>
              Stop
            </>
          ) : (
            <>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="12" 
                height="12" 
                fill="currentColor" 
                viewBox="0 0 16 16"
                style={{ marginRight: '0.25rem' }}
              >
                <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/>
              </svg>
              Preview
            </>
          )}
        </button>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '0.75rem',
        marginBottom: '0.75rem'
      }}>
        {/* Language Selection */}
        <div>
          <label 
            htmlFor="language-select" 
            style={{ 
              display: 'block', 
              fontSize: '0.75rem', 
              fontWeight: '500', 
              marginBottom: '0.25rem', 
              color: '#64748b' 
            }}
          >
            Language
          </label>
          <select 
            id="language-select"
            value={selectedLanguage}
            onChange={handleLanguageChange}
            style={{
              width: '100%',
              padding: '0.375rem 0.5rem',
              borderRadius: '0.375rem',
              border: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              color: '#334155',
              fontSize: '0.875rem'
            }}
          >
            {languages.map(lang => (
              <option key={lang} value={lang}>
                {getLanguageDisplayName(lang)} ({voicesByLanguage[lang].length})
              </option>
            ))}
          </select>
        </div>
        
        {/* Voice Selection */}
        <div>
          <label 
            htmlFor="voice-select" 
            style={{ 
              display: 'block', 
              fontSize: '0.75rem', 
              fontWeight: '500', 
              marginBottom: '0.25rem', 
              color: '#64748b' 
            }}
          >
            Voice
          </label>
          <select 
            id="voice-select"
            value={selectedVoice?.name || ''}
            onChange={handleVoiceChange}
            style={{
              width: '100%',
              padding: '0.375rem 0.5rem',
              borderRadius: '0.375rem',
              border: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              color: '#334155',
              fontSize: '0.875rem'
            }}
          >
            {voicesForSelectedLanguage.map(voice => (
              <option key={voice.name} value={voice.name}>
                {voice.name.length > 20 ? voice.name.substring(0, 20) + '...' : voice.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '0.75rem' 
      }}>
        <div>
          <label 
            htmlFor="rate-slider" 
            style={{ 
              display: 'block', 
              fontSize: '0.75rem', 
              fontWeight: '500', 
              marginBottom: '0.25rem', 
              color: '#64748b',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>Speed</span>
            <span style={{ 
              backgroundColor: '#f1f5f9', 
              padding: '0.125rem 0.375rem', 
              borderRadius: '0.25rem',
              fontSize: '0.75rem'
            }}>
              {rate.toFixed(1)}x
            </span>
          </label>
          <input 
            id="rate-slider"
            type="range" 
            min="0.5" 
            max="2" 
            step="0.1" 
            value={rate}
            onChange={handleRateChange}
            style={{ 
              width: '100%',
              accentColor: '#4f46e5'
            }}
          />
        </div>
        
        <div>
          <label 
            htmlFor="pitch-slider" 
            style={{ 
              display: 'block', 
              fontSize: '0.75rem', 
              fontWeight: '500', 
              marginBottom: '0.25rem', 
              color: '#64748b',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>Pitch</span>
            <span style={{ 
              backgroundColor: '#f1f5f9', 
              padding: '0.125rem 0.375rem', 
              borderRadius: '0.25rem',
              fontSize: '0.75rem'
            }}>
              {pitch.toFixed(1)}
            </span>
          </label>
          <input 
            id="pitch-slider"
            type="range" 
            min="0.5" 
            max="2" 
            step="0.1" 
            value={pitch}
            onChange={handlePitchChange}
            style={{ 
              width: '100%',
              accentColor: '#4f46e5'
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default VoiceCustomization