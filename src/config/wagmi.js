import { http, createConfig } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { walletConnect, injected } from 'wagmi/connectors'

const projectId = '2bf2541340dc39fea57ec973a360f93b'

export const config = createConfig({
  chains: [mainnet],
  connectors: [
    injected(),
    walletConnect({ projectId })
  ],
  transports: {
    [mainnet.id]: http('https://eth.llamarpc.com'),
  },
})