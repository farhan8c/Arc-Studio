import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { erc20Abi, isAddress } from 'viem'
import { Loader2, CheckCircle2, ExternalLink, X } from 'lucide-react'
import { getUsdc, buildTxExplorerUrl } from '@/onchain-facts'
import { parseAmount } from '@/onchain-money'
import { ConnectKitButton } from 'connectkit'

const ARC_TESTNET_CHAIN_ID = 5042002
const usdcFact = getUsdc(ARC_TESTNET_CHAIN_ID)!

interface PrefillParams {
  to: string
  amount: string
  memo?: string
}

// Parse URL params once at module level — does not need a hook or effect
function parsePrefillParams(): PrefillParams | null {
  const p = new URLSearchParams(window.location.search)
  const to = p.get('to')
  const amount = p.get('amount')
  if (to && isAddress(to) && amount && parseFloat(amount) > 0) {
    return { to, amount, memo: p.get('memo') ?? undefined }
  }
  return null
}

const initialParams = parsePrefillParams()

export function PrefillBanner() {
  const [dismissed, setDismissed] = useState(false)
  const { chainId, isConnected } = useAccount()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const { writeContract, data: txHash, isPending, isError, error, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  const params = initialParams
  if (!params || dismissed) return null

  const wrongChain = chainId !== ARC_TESTNET_CHAIN_ID

  const handlePay = () => {
    if (wrongChain) {
      switchChain({ chainId: ARC_TESTNET_CHAIN_ID })
      return
    }
    const parsed = parseAmount(ARC_TESTNET_CHAIN_ID, params.amount)
    writeContract({
      address: usdcFact.address as `0x${string}`,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [params.to as `0x${string}`, parsed.raw],
      chainId: ARC_TESTNET_CHAIN_ID,
    })
  }

  const txUrl = txHash ? buildTxExplorerUrl(ARC_TESTNET_CHAIN_ID, txHash) : null

  return (
    <div
      className="rounded-3xl p-5"
      style={{
        background: 'rgba(16,97,166,0.07)',
        border: '1px solid rgba(16,97,166,0.18)',
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--accent-hover)', letterSpacing: '0.08em' }}>
            Payment Request
          </p>
          <div className="display text-2xl font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
            {params.amount} <span className="text-base font-semibold" style={{ color: 'var(--subtle)' }}>USDC</span>
          </div>
          {params.memo && (
            <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>{params.memo}</p>
          )}
          <p className="mono mt-1.5 text-xs" style={{ color: 'var(--subtle)' }}>
            To {params.to.slice(0, 8)}…{params.to.slice(-6)}
          </p>
        </div>
        <button
          onClick={() => { setDismissed(true); reset() }}
          className="flex size-7 flex-shrink-0 items-center justify-center rounded-full hover:bg-black/5 transition-colors"
          style={{ color: 'var(--subtle)' }}
        >
          <X className="size-4" />
        </button>
      </div>

      {isSuccess && txUrl ? (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-4 flex-shrink-0" style={{ color: 'var(--success)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--success)' }}>Payment sent!</span>
          <a href={txUrl} target="_blank" rel="noreferrer"
            className="ml-auto flex items-center gap-1 text-xs" style={{ color: 'var(--accent-hover)' }}>
            View <ExternalLink className="size-3" />
          </a>
        </div>
      ) : !isConnected ? (
        <div>
          <p className="mb-2 text-xs" style={{ color: 'var(--muted)' }}>Connect your wallet to complete this payment.</p>
          <ConnectKitButton />
        </div>
      ) : (
        <button
          onClick={handlePay}
          disabled={isPending || isConfirming || isSwitching}
          className="w-full rounded-2xl py-3 text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'var(--accent)' }}
        >
          {isSwitching
            ? <span className="flex items-center justify-center gap-2"><Loader2 className="size-4 animate-spin" />Switching…</span>
            : wrongChain
              ? 'Switch to Arc Testnet'
              : isPending
                ? <span className="flex items-center justify-center gap-2"><Loader2 className="size-4 animate-spin" />Confirm in wallet…</span>
                : isConfirming
                  ? <span className="flex items-center justify-center gap-2"><Loader2 className="size-4 animate-spin" />Confirming…</span>
                  : `Pay ${params.amount} USDC`}
        </button>
      )}

      {isError && (
        <p className="mt-2 text-xs" style={{ color: 'var(--danger)' }}>
          {(error as { message?: string })?.message?.includes('user rejected')
            ? 'Transaction cancelled.'
            : 'Transaction failed. Please try again.'}
        </p>
      )}
    </div>
  )
}
