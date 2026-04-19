export default function StatsBar() {
  return (
    <div className="sbar">
      <div className="sbar-inner">
        <div className="sitem"><span className="sk">TVL</span><span className="sv up">$247.4M</span><span className="sdelta">+3.2%</span></div>
        <div className="sitem"><span className="sk">24h VOL</span><span className="sv up">$84.7M</span><span className="sdelta">+11.4%</span></div>
        <div className="sitem"><span className="sk">USERS</span><span className="sv">124K</span></div>
        <div className="sitem"><span className="sk">FEE</span><span className="sv">0.00%</span></div>
      </div>
    </div>
  )
}