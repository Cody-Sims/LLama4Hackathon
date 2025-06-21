const DescriptionPanel = ({ scriptText, isGenerating, error }) => {
  return (
    <div>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '0.75rem'
      }}>
        <h2 style={{ 
          fontSize: '1.125rem', 
          fontWeight: '600', 
          color: '#334155', 
          margin: 0 
        }}>
          Video Description
        </h2>
        
        {scriptText && (
          <span style={{ 
            backgroundColor: '#10b981', 
            color: 'white', 
            fontSize: '0.75rem', 
            fontWeight: '500',
            padding: '0.25rem 0.5rem',
            borderRadius: '9999px'
          }}>
            Ready
          </span>
        )}
      </div>
      
      {isGenerating ? (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '1.5rem 0',
          backgroundColor: '#f1f5f9',
          borderRadius: '0.5rem'
        }}>
          <svg
            style={{
              animation: 'spin 1s linear infinite',
              height: '1.5rem',
              width: '1.5rem',
              color: '#3b82f6',
              marginRight: '0.75rem'
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
          <div>
            <p style={{ color: '#4b5563', margin: 0 }}>Generating description...</p>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>This may take 15-30 seconds</p>
            <ul style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.5rem 0 0 0', paddingLeft: '1.25rem' }}>
              <li>Extracting video frames</li>
              <li>Transcribing audio</li>
              <li>Analyzing content with AI</li>
            </ul>
          </div>
        </div>
      ) : error ? (
        <div style={{ 
          backgroundColor: '#fef2f2', 
          border: '1px solid #fee2e2', 
          color: '#b91c1c', 
          padding: '0.75rem 1rem', 
          borderRadius: '0.5rem' 
        }}>
          <p style={{ fontWeight: '500', margin: 0 }}>Error</p>
          <p style={{ fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>{error}</p>
        </div>
      ) : scriptText ? (
        <div>
          <div style={{ 
            backgroundColor: '#f8fafc', 
            padding: '0.75rem', 
            borderRadius: '0.5rem', 
            border: '1px solid #e2e8f0',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            <p className="description-text" style={{ 
              color: '#334155', 
              whiteSpace: 'pre-wrap',
              margin: 0,
              fontSize: '0.9375rem',
              lineHeight: '1.5'
            }}>
              {scriptText}
            </p>
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <p style={{ 
              fontSize: '0.75rem', 
              color: '#64748b',
              margin: 0,
              display: 'flex',
              alignItems: 'center'
            }}>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 20 20" 
                fill="currentColor" 
                style={{ width: '1rem', height: '1rem', marginRight: '0.25rem' }}
              >
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
              This description will be read aloud when you play the video
            </p>
          </div>
        </div>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '1.5rem 0',
          backgroundColor: '#f1f5f9',
          borderRadius: '0.5rem',
          color: '#64748b'
        }}>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 20 20" 
            fill="currentColor" 
            style={{ width: '2rem', height: '2rem', margin: '0 auto 0.5rem' }}
          >
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
          <p style={{ margin: 0 }}>
            Click "Generate Description" to create an audio description
          </p>
        </div>
      )}
    </div>
  )
}

export default DescriptionPanel