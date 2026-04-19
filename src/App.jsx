import React, { useState, useEffect } from 'react'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useAccount } from 'wagmi'

function App() {
  const { open } = useWeb3Modal()
  const { address, isConnected } = useAccount()
  const [ethPrice, setEthPrice] = useState(3422.71)

  useEffect(() => {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
      .then(r => r.json())
      .then(d => {
        if (d.ethereum) setEthPrice(d.ethereum.usd)
      })
      .catch(() => {})
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a2a 0%, #0f0f2a 100%)',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '500px',
        margin: '0 auto',
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        padding: '2rem',
        border: '1px solid rgba(59,130,246,0.2)'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '1rem' }}>ECLIPSE PROTOCOL</h1>
        
        <button
          onClick={() => open()}
          style={{
            width: '100%',
            padding: '1rem',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer',
            marginBottom: '1rem'
          }}
        >
          {isConnected ? `${address.slice(0,6)}...${address.slice(-4)}` : 'Connect Wallet'}
        </button>

        {isConnected && (
          <button
            style={{
              width: '100%',
              padding: '1rem',
              background: '#ef4444',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Execute Trade
          </button>
        )}

        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '12px', color: '#94a3b8' }}>
          ETH Price: ${ethPrice.toLocaleString()}
        </p>
      </div>
    </div>
  )
}

export default App