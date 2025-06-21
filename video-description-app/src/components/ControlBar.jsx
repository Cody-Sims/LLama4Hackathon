const ControlBar = ({ onGenerateDescription, isGenerating, hasDescription }) => {
  // Function to play video with description
  const handlePlayWithDescription = () => {
    // Get the video element
    const videoElement = document.querySelector('video');
    
    if (videoElement) {
      // Play the video
      videoElement.play();
      
      // The VideoPlayer component will handle the speech synthesis
      // when the video starts playing, so we don't need to do anything else here
    }
  };

  return (
    <div style={{ 
      marginTop: '1.5rem', 
      display: 'flex', 
      flexWrap: 'wrap', 
      gap: '1rem',
      justifyContent: 'center'
    }}>
      <button
        onClick={onGenerateDescription}
        disabled={isGenerating}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.75rem 1.5rem',
          borderRadius: '0.5rem',
          fontWeight: '600',
          backgroundColor: isGenerating ? '#e2e8f0' : '#3b82f6',
          color: isGenerating ? '#94a3b8' : 'white',
          cursor: isGenerating ? 'not-allowed' : 'pointer',
          border: 'none',
          boxShadow: isGenerating ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
          transition: 'all 0.2s ease-in-out',
          minWidth: '200px'
        }}
        aria-label="Generate description"
      >
        {isGenerating ? (
          <>
            <svg
              style={{
                animation: 'spin 1s linear infinite',
                marginRight: '0.5rem',
                height: '1.25rem',
                width: '1.25rem',
                color: '#94a3b8'
              }}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                style={{ opacity: '0.25' }}
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                style={{ opacity: '0.75' }}
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Generating Description...
          </>
        ) : (
          <>
            <svg
              style={{
                marginRight: '0.5rem',
                height: '1.25rem',
                width: '1.25rem'
              }}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
            Generate Description
          </>
        )}
      </button>

      {hasDescription && (
        <button
          onClick={handlePlayWithDescription}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            fontWeight: '600',
            backgroundColor: '#10b981',
            color: 'white',
            cursor: 'pointer',
            border: 'none',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
            transition: 'all 0.2s ease-in-out',
            minWidth: '200px'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#059669'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
          aria-label="Play with description"
        >
          <svg
            style={{
              marginRight: '0.5rem',
              height: '1.25rem',
              width: '1.25rem'
            }}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Play with Description
        </button>
      )}
    </div>
  )
}

export default ControlBar