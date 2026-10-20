import { useAccount, useReadContract } from 'wagmi'
import { erc20Abi } from 'viem'
import { NetworkArc } from '@web3icons/react'
import { getUsdc, requireChain } from '@/onchain-facts'
import { Amount, usdcDecimalsFor } from '@/onchain-money'

const ARC_TESTNET_CHAIN_ID = 5042002

const usdcFact = getUsdc(ARC_TESTNET_CHAIN_ID)!
const arcChain = requireChain(ARC_TESTNET_CHAIN_ID)

interface BalanceCardProps {
  onSend: () => void
  onReceive: () => void
}

export function BalanceCard({ onSend, onReceive }: BalanceCardProps) {
  const { address, isConnected } = useAccount()

  const { data: rawBalance, isLoading } = useReadContract({
    address: usdcFact.address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: ARC_TESTNET_CHAIN_ID,
    query: { enabled: !!address },
  })

  const formattedBalance =
    rawBalance != null
      ? Amount.fromRaw(rawBalance, usdcDecimalsFor(ARC_TESTNET_CHAIN_ID)).toFixed(2)
      : '0.00'

  return (
    <section
      className="rounded-3xl p-6 shadow-sm"
      style={{
        background: 'var(--surface-strong)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Network badge */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <NetworkArc size={18} variant="branded" />
          <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>
            Arc Testnet
          </span>
        </div>
        {isConnected && (
          <span
            className="mono rounded-full px-2.5 py-0.5 text-xs"
            style={{ background: 'var(--surface-muted)', color: 'var(--subtle)' }}
          >
            {address?.slice(0, 6)}…{address?.slice(-4)}
          </span>
        )}
      </div>

      {/* Hero balance */}
      <div className="mb-1">
        <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
          USDC Balance
        </span>
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <span
          className="display text-5xl font-bold tabular-nums"
          style={{ color: 'var(--ink)' }}
        >
          {!isConnected
            ? '—'
            : isLoading
              ? <span className="animate-pulse text-4xl">…</span>
              : formattedBalance}
        </span>
        <span className="text-xl font-semibold" style={{ color: 'var(--subtle)' }}>
          USDC
        </span>
      </div>
      <p className="text-xs mb-6" style={{ color: 'var(--subtle)' }}>
        {isConnected ? arcChain.name : 'Connect your wallet to view balance'}
      </p>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onSend}
          disabled={!isConnected}
          className="flex-1 rounded-2xl py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: 'var(--accent)' }}
        >
          Send
        </button>
        <button
          onClick={onReceive}
          disabled={!isConnected}
          className="flex-1 rounded-2xl py-3.5 text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            background: 'var(--surface-muted)',
            color: 'var(--ink)',
            border: '1px solid var(--border)',
          }}
        >
          Receive
        </button>
      </div>
    </section>
  )
}
