import { useState } from 'react'
import { ConnectKitButton } from 'connectkit'
import { TokenUSDC } from '@web3icons/react'
import { BalanceCard } from './components/BalanceCard'
import { SendSheet } from './components/SendSheet'
import { ReceiveSheet } from './components/ReceiveSheet'
import { TransactionHistory } from './components/TransactionHistory'
import { PrefillBanner } from './components/PrefillBanner'

export default function App() {
  const [sendOpen, setSendOpen] = useState(false)
  const [receiveOpen, setReceiveOpen] = useState(false)

  return (
    <div
      className="min-h-dvh px-4 py-8"
      style={{ background: 'var(--bg-gradient)' }}
    >
      <div className="mx-auto max-w-md space-y-4">
        {/* Header */}
        <header className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TokenUSDC variant="branded" size={28} />
            <span className="display text-xl font-bold" style={{ color: 'var(--ink)' }}>
              Arc Pay
            </span>
          </div>
          <ConnectKitButton />
        </header>

        {/* Payment request banner (shown when ?to=&amount= params present) */}
        <PrefillBanner />

        {/* Balance card + actions */}
        <BalanceCard
          onSend={() => setSendOpen(true)}
          onReceive={() => setReceiveOpen(true)}
        />

        {/* Transaction history */}
        <TransactionHistory />

        {/* Testnet hint */}
        <p className="text-center text-xs" style={{ color: 'var(--subtle)' }}>
          Arc Testnet · USDC is the native gas token · Use "Get test USDC" in the Arc Studio sidebar
        </p>
      </div>

      {/* Sheets */}
      <SendSheet open={sendOpen} onClose={() => setSendOpen(false)} />
      <ReceiveSheet open={receiveOpen} onClose={() => setReceiveOpen(false)} />
    </div>
  )
}
