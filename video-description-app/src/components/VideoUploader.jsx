import { useState, useRef } from 'react'

const VideoUploader = ({ onFileUpload }) => {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith('video/')) {
        onFileUpload(file)
      } else {
        alert('Please upload a valid video file')
      }
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.type.startsWith('video/')) {
        onFileUpload(file)
      } else {
        alert('Please upload a valid video file')
      }
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current.click()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div
        style={{
          padding: '3rem',
          border: '2px dashed',
          borderColor: isDragging ? '#3b82f6' : '#cbd5e1',
          borderRadius: '1rem',
          cursor: 'pointer',
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDragging ? '#eff6ff' : 'transparent',
          width: '100%',
          transition: 'all 0.2s ease-in-out',
          boxShadow: isDragging ? '0 0 0 4px rgba(59, 130, 246, 0.1)' : 'none'
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleButtonClick}
        aria-label="Drop zone for video upload"
        role="button"
        tabIndex="0"
      >
        <div style={{
          backgroundColor: '#f1f5f9',
          borderRadius: '50%',
          width: '5rem',
          height: '5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem'
        }}>
          <svg
            style={{
              width: '2.5rem',
              height: '2.5rem',
              color: '#3b82f6'
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
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e3a8a', marginBottom: '0.5rem' }}>
          Upload your video
        </h3>
        <p style={{ fontSize: '1rem', color: '#64748b', marginBottom: '1.5rem', textAlign: 'center' }}>
          Drag and drop your video file here or click to browse
        </p>
        <button
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease-in-out'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
        >
          Browse Files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          aria-label="Video file input"
        />
      </div>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: '0.5rem',
        padding: '0.75rem 1rem',
        maxWidth: '80%'
      }}>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 20 20" 
          fill="currentColor" 
          style={{ width: '1.25rem', height: '1.25rem', color: '#64748b', marginRight: '0.5rem' }}
        >
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
          Supported formats: MP4, WebM, MOV, AVI (max 100MB)
        </p>
      </div>
    </div>
  )
}

export default VideoUploader