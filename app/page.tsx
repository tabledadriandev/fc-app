'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useAccount, useConnect, useDisconnect, useWriteContract } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { computeBalanceEurValue } from '@/lib/pricing'
import { getTokenBalance, formatTokenAmount, WHITELIST_ABI } from '@/lib/blockchain'
import { MIN_EUR_VALUE_REQUIREMENT, WHITELIST_CONTRACT_ADDRESS } from '@/lib/config'

type EligibilityState = 'idle' | 'checking' | 'ineligible' | 'eligible'
type WhitelistState = 'unknown' | 'checking' | 'not-whitelisted' | 'whitelisted'

export default function Home() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, error: connectError, isPending: isConnectPending } = useConnect()
  const { disconnect } = useDisconnect()

  const [eligibilityState, setEligibilityState] = useState<EligibilityState>('idle')
  const [whitelistState, setWhitelistState] = useState<WhitelistState>('unknown')
  const [balanceDisplay, setBalanceDisplay] = useState<string | null>(null)
  const [eurValue, setEurValue] = useState<number | null>(null)
  const [eligibilityMessage, setEligibilityMessage] = useState<string>('')
  const [eligibilityError, setEligibilityError] = useState<string | null>(null)

  const {
    writeContract,
    isPending: isJoinPending,
    error: joinError,
    isSuccess: isJoinSuccess,
  } = useWriteContract()

  const primaryConnector = useMemo(
    () => connectors.find((c) => c.id === 'injected') ?? connectors[0],
    [connectors]
  )

  useEffect(() => {
    if (!isConnected || !address) {
      setEligibilityState('idle')
      setWhitelistState('unknown')
      setBalanceDisplay(null)
      setEurValue(null)
      setEligibilityMessage('Connect your wallet to check your $tabledadrian eligibility.')
      setEligibilityError(null)
      return
    }

    let cancelled = false

    async function checkEligibilityAndStatus() {
      setEligibilityState('checking')
      setWhitelistState('checking')
      setEligibilityError(null)

      try {
        const rawBalance = await getTokenBalance(address)
        const { eurValue: value, tokenAmount, meetsRequirement } =
          await computeBalanceEurValue(rawBalance)

        if (cancelled) return

        setBalanceDisplay(tokenAmount)
        setEurValue(value)

        if (!meetsRequirement) {
          setEligibilityState('ineligible')
          setEligibilityMessage(
            `You currently hold ~€${value.toFixed(
              2
            )} worth of $tabledadrian. You need at least €${MIN_EUR_VALUE_REQUIREMENT.toFixed(
              2
            )} to join the whitelist.`
          )
        } else {
          setEligibilityState('eligible')
          setEligibilityMessage(
            `You hold approximately €${value.toFixed(
              2
            )} of $tabledadrian. You’re eligible to join the DeSci whitelist.`
          )
        }

        // Whitelist status is only meaningful if a contract address is configured.
        if (!WHITELIST_CONTRACT_ADDRESS) {
          setWhitelistState('not-whitelisted')
        } else {
          // Simple read via public client is implemented in lib/blockchain if you want
          // a pre-flight check. For now, we optimistically assume not whitelisted
          // until the join transaction succeeds.
          setWhitelistState('not-whitelisted')
        }
      } catch (err) {
        console.error(err)
        if (cancelled) return
        setEligibilityState('idle')
        setEligibilityError('Unable to verify your token balance right now. Please try again.')
      }
    }

    checkEligibilityAndStatus()

    return () => {
      cancelled = true
    }
  }, [address, isConnected])

  const handleConnect = () => {
    if (!primaryConnector) return
    connect({ connector: primaryConnector as injected.InjectedConnector })
  }

  const handleJoinWhitelist = async () => {
    if (!address || !WHITELIST_CONTRACT_ADDRESS) return

    setWhitelistState('checking')

    try {
      await writeContract({
        address: WHITELIST_CONTRACT_ADDRESS,
        abi: WHITELIST_ABI,
        functionName: 'joinWhitelist',
        args: [],
      })
      // wagmi will set isJoinSuccess; we also eagerly move UI to whitelisted.
      setWhitelistState('whitelisted')
    } catch (err) {
      console.error('Error joining whitelist:', err)
      setWhitelistState('not-whitelisted')
    }
  }

  const notConnected = !isConnected
  const insufficientBalance = eligibilityState === 'ineligible'
  const canJoin =
    isConnected &&
    eligibilityState === 'eligible' &&
    whitelistState !== 'whitelisted' &&
    !!WHITELIST_CONTRACT_ADDRESS

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-10">
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9 overflow-hidden rounded-full border border-emerald-400/60 bg-slate-900/60">
              {/* Logo placed in `public/ta..PNG` */}
              <Image src="/ta..PNG" alt="Table d'Adrian logo" fill className="object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-[0.2em] text-emerald-300">
                TABLE D&apos;ADRIAN
              </span>
              <span className="text-xs text-slate-400">
                DeSci whitelist access powered by the $tabledadrian token · Q1&nbsp;2026
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isConnected && address && (
              <span className="rounded-full bg-slate-800 px-4 py-1 text-xs text-slate-200">
                {address.slice(0, 6)}…{address.slice(-4)}
              </span>
            )}

            {isConnected ? (
              <button
                onClick={() => disconnect()}
                className="rounded-full border border-slate-600 px-4 py-1 text-xs font-semibold text-slate-200 hover:border-slate-400 hover:bg-slate-800"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={handleConnect}
                disabled={!primaryConnector || isConnectPending}
                className="rounded-full bg-emerald-400 px-4 py-1 text-xs font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {primaryConnector
                  ? isConnectPending
                    ? 'Connecting…'
                    : 'Connect Wallet'
                  : 'No Wallet Found'}
              </button>
            )}
          </div>
        </header>

        <section className="grid flex-1 gap-10 md:grid-cols-[3fr,2fr]">
          <div className="flex flex-col justify-center space-y-6">
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
              Join the Future
              <br />
              of <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">DeSci</span>
            </h1>

            <p className="max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
              Decentralized science (DeSci) uses Web3 rails to make research funding, data, and
              incentives open, transparent, and community‑owned. The{' '}
              <span className="font-semibold">$tabledadrian</span> token is your access key to a
              wellness‑ and longevity‑focused DeSci ecosystem—where experiments, protocols, and
              insights are aligned with the people they are meant to serve.
            </p>

            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-100 shadow-[0_0_40px_rgba(16,185,129,0.25)]">
              <p className="font-semibold">
                Hold at least €{MIN_EUR_VALUE_REQUIREMENT.toFixed(2)} of $tabledadrian to join the
                DeSci whitelist.
              </p>
              <p className="mt-1 text-xs text-emerald-200/90">
                Your wallet balance is checked on‑chain and priced in EUR via a configurable oracle
                utility. No personal data, only your address and token holdings.
              </p>
            </div>

            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
              <span className="rounded-full border border-slate-700 px-3 py-1">
                Open &amp; transparent research rails
              </span>
              <span className="rounded-full border border-slate-700 px-3 py-1">
                Token‑aligned wellness &amp; longevity community
              </span>
              <span className="rounded-full border border-slate-700 px-3 py-1">
                Whitelist‑gated experiments &amp; drops
              </span>
            </div>
          </div>

          <aside className="flex items-center">
            <div className="w-full rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl shadow-black/40 backdrop-blur">
              <h2 className="mb-4 text-sm font-semibold tracking-[0.15em] text-slate-400">
                DESCi ACCESS PANEL
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2">
                  <span className="text-xs text-slate-400">Connection</span>
                  <span
                    className={`text-xs font-semibold ${
                      notConnected ? 'text-amber-300' : 'text-emerald-300'
                    }`}
                  >
                    {notConnected ? 'Not connected' : 'Wallet connected'}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2">
                  <span className="text-xs text-slate-400">$tabledadrian balance</span>
                  <span className="text-xs font-mono text-slate-100">
                    {balanceDisplay ? `${Number(balanceDisplay).toLocaleString()} TA` : '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2">
                  <span className="text-xs text-slate-400">Estimated EUR value</span>
                  <span className="text-xs font-mono text-slate-100">
                    {eurValue !== null ? `€${eurValue.toFixed(2)}` : '—'}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-200">
                  {eligibilityError ? (
                    <p className="text-rose-300">{eligibilityError}</p>
                  ) : (
                    <p>{eligibilityMessage}</p>
                  )}
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  {notConnected && (
                    <button
                      onClick={handleConnect}
                      disabled={!primaryConnector || isConnectPending}
                      className="w-full rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {primaryConnector
                        ? isConnectPending
                          ? 'Connecting wallet…'
                          : 'Connect wallet to continue'
                        : 'Install a Web3 wallet'}
                    </button>
                  )}

                  {!notConnected && (
                    <button
                      onClick={handleJoinWhitelist}
                      disabled={!canJoin || isJoinPending || insufficientBalance}
                      className={`w-full rounded-xl px-4 py-2 text-sm font-semibold transition ${
                        canJoin
                          ? 'bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/30 hover:bg-emerald-300'
                          : 'bg-slate-800 text-slate-500'
                      } disabled:cursor-not-allowed`}
                    >
                      {insufficientBalance
                        ? 'Hold ≥ €1 of $tabledadrian to join'
                        : !WHITELIST_CONTRACT_ADDRESS
                        ? 'Configure whitelist contract address'
                        : isJoinPending
                        ? 'Joining whitelist…'
                        : whitelistState === 'whitelisted' || isJoinSuccess
                        ? 'Already whitelisted'
                        : 'Join DeSci Whitelist'}
                    </button>
                  )}

                  {(joinError || !WHITELIST_CONTRACT_ADDRESS) && (
                    <p className="mt-1 text-[11px] leading-snug text-slate-400">
                      {joinError
                        ? 'We could not submit your whitelist transaction. Check your wallet, gas settings, and try again.'
                        : 'Deploy the `DeSciWhitelist` contract and set NEXT_PUBLIC_WHITELIST_CONTRACT_ADDRESS in `.env.local` to enable on‑chain joins.'}
                    </p>
                  )}
                </div>

                <div className="mt-4 border-t border-slate-800 pt-3 text-[11px] leading-relaxed text-slate-400">
                  <p>
                    Status states:{' '}
                    <span className="font-semibold text-slate-200">
                      Not connected
                    </span>{' '}
                    →{' '}
                    <span className="font-semibold text-slate-200">
                      Connected, checking balance
                    </span>{' '}
                    →{' '}
                    <span className="font-semibold text-slate-200">
                      Eligible / insufficient
                    </span>{' '}
                    →{' '}
                    <span className="font-semibold text-slate-200">
                      Joined whitelist
                    </span>
                    .
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <footer className="mt-10 border-t border-slate-800 pt-4 text-xs text-slate-400">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p>Built for the $tabledadrian DeSci whitelist community · Q1 2026</p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://x.com/tabledadrian?s=21"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-emerald-300"
              >
                X (Twitter)
              </a>
              <span className="text-slate-700">•</span>
              <a
                href="https://farcaster.xyz/adrsteph.base.eth"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-emerald-300"
              >
                Farcaster
              </a>
              <span className="text-slate-700">•</span>
              <a
                href="https://base.app/profile/adrsteph"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-emerald-300"
              >
                Base profile
              </a>
              <span className="text-slate-700">•</span>
              <a
                href="https://t.me/+XGDHSatYUIswNzY0"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-emerald-300"
              >
                Telegram hub
              </a>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}

