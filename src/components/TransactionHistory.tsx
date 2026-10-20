import { useAccount, usePublicClient } from 'wagmi'
import { useEffect, useState } from 'react'
import { parseAbiItem } from 'viem'
import { ArrowUpRight, ArrowDownLeft, ExternalLink } from 'lucide-react'
import { getUsdc, buildTxExplorerUrl } from '@/onchain-facts'
import { Amount, usdcDecimalsFor } from '@/onchain-money'

const ARC_TESTNET_CHAIN_ID = 5042002
const usdcFact = getUsdc(ARC_TESTNET_CHAIN_ID)!

interface TxEntry {
  hash: string
  direction: 'sent' | 'received'
  counterparty: string
  amount: string
  blockNumber: bigint
}

export function TransactionHistory() {
  const { address } = useAccount()
  const publicClient = usePublicClient({ chainId: ARC_TESTNET_CHAIN_ID })
  const [txs, setTxs] = useState<TxEntry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!address || !publicClient) return
    let cancelled = false

    async function fetch() {
      setLoading(true)
      try {
        const head = await publicClient!.getBlockNumber()
        const fromBlock = head > 5000n ? head - 5000n : 0n

        const [sentLogs, receivedLogs] = await Promise.all([
          publicClient!.getLogs({
            address: usdcFact.address as `0x${string}`,
            event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
            args: { from: address },
            fromBlock,
            toBlock: head,
          }),
          publicClient!.getLogs({
            address: usdcFact.address as `0x${string}`,
            event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
            args: { to: address },
            fromBlock,
            toBlock: head,
          }),
        ])

        if (cancelled) return

        const decimals = usdcDecimalsFor(ARC_TESTNET_CHAIN_ID)
        const all: TxEntry[] = [
          ...sentLogs.map((log) => ({
            hash: log.transactionHash ?? '',
            direction: 'sent' as const,
            counterparty: (log.args.to as string) ?? '',
            amount: Amount.fromRaw(log.args.value as bigint, decimals).toFixed(2),
            blockNumber: log.blockNumber ?? 0n,
          })),
          ...receivedLogs.map((log) => ({
            hash: log.transactionHash ?? '',
            direction: 'received' as const,
            counterparty: (log.args.from as string) ?? '',
            amount: Amount.fromRaw(log.args.value as bigint, decimals).toFixed(2),
            blockNumber: log.blockNumber ?? 0n,
          })),
        ]
          .filter((t) => t.hash !== ('' as `0x${string}`))
          .sort((a, b) => (a.blockNumber > b.blockNumber ? -1 : 1))
          .slice(0, 20)

        setTxs(all)
      } catch {
        // silently fail — logs are a nice-to-have
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetch()
    return () => { cancelled = true }
  }, [address, publicClient])

  if (!address) return null

  return (
    <section
      className="rounded-3xl p-5"
      style={{
        background: 'var(--surface-strong)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid var(--border)',
      }}
    >
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>
        Recent Activity
      </h3>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="size-9 rounded-full" style={{ background: 'var(--surface-muted)' }} />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 rounded" style={{ background: 'var(--surface-muted)' }} />
                <div className="h-2.5 w-16 rounded" style={{ background: 'var(--surface-muted)' }} />
              </div>
              <div className="h-3.5 w-12 rounded" style={{ background: 'var(--surface-muted)' }} />
            </div>
          ))}
        </div>
      ) : txs.length === 0 ? (
        <p className="py-4 text-center text-sm" style={{ color: 'var(--subtle)' }}>
          No recent transfers
        </p>
      ) : (
        <ul className="space-y-2">
          {txs.map((tx) => (
            <li key={tx.hash} className="flex items-center gap-3">
              {/* Icon */}
              <div
                className="flex size-9 flex-shrink-0 items-center justify-center rounded-full"
                style={{
                  background:
                    tx.direction === 'sent'
                      ? 'rgba(186,43,76,0.10)'
                      : 'rgba(26,128,71,0.10)',
                }}
              >
                {tx.direction === 'sent' ? (
                  <ArrowUpRight className="size-4" style={{ color: 'var(--danger)' }} />
                ) : (
                  <ArrowDownLeft className="size-4" style={{ color: 'var(--success)' }} />
                )}
              </div>

              {/* Address + type */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
                  {tx.direction === 'sent' ? 'Sent' : 'Received'}
                </p>
                <p className="mono truncate text-xs" style={{ color: 'var(--subtle)' }}>
                  {tx.direction === 'sent' ? 'To' : 'From'} {tx.counterparty.slice(0, 6)}…{tx.counterparty.slice(-4)}
                </p>
              </div>

              {/* Amount + link */}
              <div className="flex flex-col items-end gap-0.5">
                <span
                  className="text-sm font-semibold tabular-nums"
                  style={{ color: tx.direction === 'sent' ? 'var(--danger)' : 'var(--success)' }}
                >
                  {tx.direction === 'sent' ? '-' : '+'}{tx.amount}
                </span>
                <a
                  href={buildTxExplorerUrl(ARC_TESTNET_CHAIN_ID, tx.hash)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-0.5 text-xs"
                  style={{ color: 'var(--subtle)' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="size-2.5" />
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
