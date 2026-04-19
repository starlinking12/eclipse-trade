import React, { useEffect } from 'react'
import Navbar from './components/Navbar'
import StatsBar from './components/StatsBar'
import TradingInterface from './components/TradingInterface'

function App() {
  useEffect(() => {
    const bgDiv = document.createElement('div')
    bgDiv.className = 'bg'
    bgDiv.innerHTML = '<div class="orb o1"></div><div class="orb o2"></div><div class="orb o3"></div><div class="orb o4"></div>'
    document.body.appendChild(bgDiv)
    
    const noiseDiv = document.createElement('div')
    noiseDiv.className = 'noise'
    document.body.appendChild(noiseDiv)
  }, [])

  return (
    <div className="app">
      <Navbar />
      <StatsBar />
      <TradingInterface />
    </div>
  )
}

export default App