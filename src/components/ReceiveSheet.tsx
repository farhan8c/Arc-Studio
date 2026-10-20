import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount } from 'wagmi'
import { X, Copy, CheckCheck, Link } from 'lucide-react'

const springs = {
  sheet: { type: 'spring' as const, stiffness: 380, damping: 38 },
}

const spectral = 'linear-gradient(90deg, #7c3aed, #2563eb, #0891b2, #059669)'

const QUICK_REQUEST_AMOUNTS = ['1', '5', '10', '25']

interface ReceiveSheetProps {
  open: boolean
  onClose: () => void
}

export function ReceiveSheet({ open, onClose }: ReceiveSheetProps) {
  const { address } = useAccount()
  const [requestAmount, setRequestAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [copied, setCopied] = useState<'address' | 'link' | null>(null)

  const paymentLink = (() => {
    if (!address) return ''
    const params = new URLSearchParams({ to: address })
    if (requestAmount && parseFloat(requestAmount) > 0) params.set('amount', requestAmount)
    if (memo.trim()) params.set('memo', memo.trim())
    return `${window.location.origin}?${params.toString()}`
  })()

  const copyToClipboard = async (text: string, type: 'address' | 'link') => {
    await navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
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
            <div className="h-1" style={{ background: spectral }} />

            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div className="flex flex-col">
                <div className="h-1 w-10 rounded-full bg-black/10 mb-3" />
                <h2 className="display text-lg font-bold" style={{ color: 'var(--ink)' }}>
                  Receive USDC
                </h2>
              </div>
              <button
                onClick={onClose}
                className="flex size-8 items-center justify-center rounded-full transition-colors hover:bg-black/5"
                style={{ color: 'var(--subtle)' }}
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="px-5 pb-8 pt-2 space-y-4">
              {/* Wallet address */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                  Your address
                </label>
                <div
                  className="flex items-center gap-3 rounded-2xl px-4 py-3"
                  style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
                >
                  <span
                    className="mono flex-1 truncate text-sm"
                    style={{ color: 'var(--ink-2)' }}
                  >
                    {address}
                  </span>
                  <button
                    onClick={() => void copyToClipboard(address!, 'address')}
                    className="flex size-7 flex-shrink-0 items-center justify-center rounded-xl transition-colors hover:bg-black/5"
                    style={{ color: copied === 'address' ? 'var(--success)' : 'var(--subtle)' }}
                  >
                    {copied === 'address' ? <CheckCheck className="size-3.5" /> : <Copy className="size-3.5" />}
                  </button>
                </div>
              </div>

              {/* Optional: request specific amount */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                  Request amount (optional)
                </label>
                <div
                  className="rounded-2xl p-4"
                  style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
                >
                  <input
                    inputMode="decimal"
                    value={requestAmount}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9.]/g, '')
                      if (v === '' || /^\d*\.?\d*$/.test(v)) setRequestAmount(v)
                    }}
                    placeholder="0.00"
                    className="display w-full bg-transparent text-3xl font-bold tabular-nums outline-none placeholder:text-slate-300"
                    style={{ color: 'var(--ink)' }}
                  />
                  <span className="mt-1 block text-xs font-medium" style={{ color: 'var(--subtle)' }}>
                    USDC
                  </span>
                </div>
                <div className="mt-2 flex gap-2">
                  {QUICK_REQUEST_AMOUNTS.map((q) => (
                    <button
                      key={q}
                      onClick={() => setRequestAmount(q)}
                      className="flex-1 rounded-xl py-1.5 text-xs font-semibold transition-colors hover:opacity-80"
                      style={{
                        background: requestAmount === q ? 'var(--accent)' : 'var(--surface-muted)',
                        color: requestAmount === q ? '#fff' : 'var(--ink-2)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      ${q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Memo */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                  Memo (optional)
                </label>
                <input
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="e.g. Coffee, Invoice #42, Split dinner…"
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none placeholder:text-slate-300"
                  style={{
                    background: 'var(--surface-muted)',
                    border: '1px solid var(--border)',
                    color: 'var(--ink)',
                  }}
                />
              </div>

              {/* Copy payment link */}
              <button
                onClick={() => void copyToClipboard(paymentLink, 'link')}
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background: copied === 'link' ? 'rgba(26,128,71,0.1)' : 'var(--accent)',
                  color: copied === 'link' ? 'var(--success)' : '#fff',
                }}
              >
                {copied === 'link' ? (
                  <>
                    <CheckCheck className="size-4" /> Link copied!
                  </>
                ) : (
                  <>
                    <Link className="size-4" /> Copy payment link
                  </>
                )}
              </button>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
