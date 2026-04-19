import React from 'react'

function App() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0a0a2a 0%, #0f0f2a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(20px)',
        borderRadius: '32px',
        padding: '2rem',
        textAlign: 'center',
        maxWidth: '500px',
        width: '100%'
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>ECLIPSE PROTOCOL</h1>
        <p style={{ marginBottom: '1rem' }}>If you see this, React is working!</p>
        <button style={{
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          color: 'white',
          border: 'none',
          padding: '1rem',
          borderRadius: '12px',
          cursor: 'pointer',
          width: '100%'
        }}>
          Test Button
        </button>
      </div>
    </div>
  )
}

export default App