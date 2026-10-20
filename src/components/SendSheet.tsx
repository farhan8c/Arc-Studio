import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain, useReadContract } from 'wagmi'
import { erc20Abi, isAddress } from 'viem'
import { ExternalLink, X, Loader2, CheckCircle2 } from 'lucide-react'
import { getUsdc, buildTxExplorerUrl } from '@/onchain-facts'
import { parseAmount, Amount, usdcDecimalsFor } from '@/onchain-money'

const ARC_TESTNET_CHAIN_ID = 5042002
const usdcFact = getUsdc(ARC_TESTNET_CHAIN_ID)!

const QUICK_AMOUNTS = ['0.10', '0.25', '1.00', '5.00']

const springs = {
  sheet: { type: 'spring' as const, stiffness: 380, damping: 38 },
}

const spectral = 'linear-gradient(90deg, #7c3aed, #2563eb, #0891b2, #059669)'

function parseOnchainError(error: unknown): string {
  const msg = (error as { message?: string })?.message?.toLowerCase() ?? ''
  if (msg.includes('user rejected') || (error as { code?: number })?.code === 4001) return 'Transaction cancelled.'
  if (msg.includes('insufficient') || msg.includes('exceeds balance')) return 'Insufficient balance.'
  if (msg.includes('reverted')) return 'Transaction failed. Please try again.'
  if (msg.includes('network') || msg.includes('timeout')) return 'Network error. Please retry.'
  return 'Something went wrong. Please try again.'
}

interface SendSheetProps {
  open: boolean
  onClose: () => void
}

export function SendSheet({ open, onClose }: SendSheetProps) {
  const { address, chainId } = useAccount()
  const { switchChain, isPending: isSwitching } = useSwitchChain()

  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')

  const { data: rawBalance } = useReadContract({
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
      : null

  const {
    writeContract,
    data: txHash,
    isPending,
    isError,
    error,
    reset,
  } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  const wrongChain = chainId !== ARC_TESTNET_CHAIN_ID
  const validAddress = isAddress(recipient)
  const validAmount = /^\d+(\.\d{1,6})?$/.test(amount) && parseFloat(amount) > 0
  const ready = validAddress && validAmount && !isPending && !isConfirming && !isSuccess

  const handleSend = () => {
    if (wrongChain) {
      switchChain({ chainId: ARC_TESTNET_CHAIN_ID })
      return
    }
    if (!validAddress || !validAmount) return
    const parsed = parseAmount(ARC_TESTNET_CHAIN_ID, amount)
    writeContract({
      address: usdcFact.address as `0x${string}`,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [recipient, parsed.raw],
      chainId: ARC_TESTNET_CHAIN_ID,
    })
  }

  const handleClose = () => {
    onClose()
    setTimeout(() => {
      reset()
      setRecipient('')
      setAmount('')
    }, 350)
  }

  const txUrl = txHash ? buildTxExplorerUrl(ARC_TESTNET_CHAIN_ID, txHash) : null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" />
          <motion.section
            className="relative w-full max-w-md overflow-hidden rounded-t-3xl"
            style={{
              background: 'rgba(255,255,255,0.94)',
              backdropFilter: 'blur(40px) saturate(200%)',
              WebkitBackdropFilter: 'blur(40px) saturate(200%)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={springs.sheet}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Spectral strip */}
            <div className="h-1" style={{ background: spectral }} />

            {/* Drag handle + header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div className="flex flex-col">
                <div className="h-1 w-10 rounded-full bg-black/10 mb-3" />
                <h2 className="display text-lg font-bold" style={{ color: 'var(--ink)' }}>
                  Send USDC
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="flex size-8 items-center justify-center rounded-full transition-colors hover:bg-black/5"
                style={{ color: 'var(--subtle)' }}
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="px-5 pb-8 pt-2 space-y-3">
              {/* Recipient */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                  Recipient address
                </label>
                <input
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value.trim())}
                  placeholder="0x…"
                  disabled={isSuccess}
                  className="mono w-full rounded-2xl px-4 py-3 text-sm outline-none transition-all placeholder:text-slate-300 disabled:opacity-50"
                  style={{
                    background: 'var(--surface-muted)',
                    border: `1px solid ${recipient && !validAddress ? 'var(--danger)' : 'var(--border)'}`,
                    color: 'var(--ink)',
                  }}
                />
                {recipient && !validAddress && (
                  <p className="mt-1 text-xs" style={{ color: 'var(--danger)' }}>
                    Invalid address
                  </p>
                )}
              </div>

              {/* Amount */}
              <div
                className="rounded-2xl p-4"
                style={{
                  background: 'var(--surface-muted)',
                  border: '1px solid var(--border)',
                }}
              >
                <input
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9.]/g, '')
                    if (v === '' || /^\d*\.?\d*$/.test(v)) setAmount(v)
                  }}
                  placeholder="0.00"
                  disabled={isSuccess}
                  className="display w-full bg-transparent text-4xl font-bold tabular-nums outline-none placeholder:text-slate-300 disabled:opacity-50"
                  style={{ color: 'var(--ink)' }}
                />
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: 'var(--subtle)' }}>USDC</span>
                  {formattedBalance && (
                    <button
                      onClick={() => setAmount(formattedBalance)}
                      disabled={isSuccess}
                      className="text-xs font-semibold disabled:opacity-40"
                      style={{ color: 'var(--accent-hover)' }}
                    >
                      Balance: {formattedBalance} · Max
                    </button>
                  )}
                </div>
              </div>

              {/* Quick amounts */}
              <div className="flex gap-2">
                {QUICK_AMOUNTS.map((q) => (
                  <button
                    key={q}
                    onClick={() => setAmount(q)}
                    disabled={isSuccess}
                    className="flex-1 rounded-xl py-2 text-xs font-semibold transition-colors hover:opacity-80 disabled:opacity-40"
                    style={{
                      background: amount === q ? 'var(--accent)' : 'var(--surface-muted)',
                      color: amount === q ? '#fff' : 'var(--ink-2)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    ${q}
                  </button>
                ))}
              </div>

              {/* Success receipt */}
              {isSuccess && txUrl && (
                <div
                  className="flex items-center justify-between rounded-2xl px-4 py-3"
                  style={{ background: 'rgba(26,128,71,0.08)', border: '1px solid rgba(26,128,71,0.2)' }}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4" style={{ color: 'var(--success)' }} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--success)' }}>
                      Sent {amount} USDC
                    </span>
                  </div>
                  <a
                    href={txUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs font-medium"
                    style={{ color: 'var(--accent-hover)' }}
                  >
                    Explorer <ExternalLink className="size-3" />
                  </a>
                </div>
              )}

              {/* Error */}
              {isError && (
                <p className="rounded-xl px-4 py-2.5 text-xs font-medium"
                  style={{ background: 'rgba(186,43,76,0.08)', color: 'var(--danger)' }}>
                  {parseOnchainError(error)}
                </p>
              )}

              {/* CTA */}
              {!isSuccess ? (
                <button
                  onClick={handleSend}
                  disabled={!wrongChain && (!ready || isSwitching)}
                  className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
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
                          : 'Send USDC'}
                </button>
              ) : (
                <button
                  onClick={handleClose}
                  className="w-full rounded-2xl py-3.5 text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99]"
                  style={{ background: 'var(--surface-muted)', color: 'var(--ink)', border: '1px solid var(--border)' }}
                >
                  Done
                </button>
              )}
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
