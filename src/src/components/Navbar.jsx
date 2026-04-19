import React from 'react'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useAccount } from 'wagmi'

export default function Navbar() {
  const { open } = useWeb3Modal()
  const { address, isConnected } = useAccount()

  return (
    <nav className="nav">
      <div className="logo">
        <div className="logo-icon"></div>
        <span className="logo-txt">Eclipse Trade</span>
      </div>
      <div className="nav-r">
        <div className="net-badge">Eclipse Mainnet</div>
        <button className="btn-wallet" onClick={() => open()}>
          {isConnected ? `${address.slice(0,6)}...${address.slice(-4)}` : 'Connect Wallet'}
        </button>
      </div>
    </nav>
  )
}