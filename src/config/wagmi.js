import { http, createConfig } from 'wagmi'
import { mainnet, bsc, polygon, arbitrum } from 'wagmi/chains'
import { walletConnect, injected } from 'wagmi/connectors'

const projectId = '2bf2541340dc39fea57ec973a360f93b'

export const config = createConfig({
  chains: [mainnet, bsc, polygon, arbitrum],
  connectors: [
    injected(),
    walletConnect({ projectId })
  ],
  transports: {
    [mainnet.id]: http('https://eth.llamarpc.com'),
    [bsc.id]: http('https://bsc-dataseed.binance.org'),
    [polygon.id]: http('https://polygon-rpc.com'),
    [arbitrum.id]: http('https://arb1.arbitrum.io/rpc'),
  }
})