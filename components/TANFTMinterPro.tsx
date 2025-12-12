"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useAccount, usePublicClient, useWalletClient, useConnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { parseEther, formatEther } from "viem";

type Step = "connect" | "check" | "generate" | "preview" | "mint" | "success";
type TabType = "mint" | "leaderboard" | "transactions";

interface LeaderboardEntry {
  username: string;
  wallet: string;
  count: number;
  totalEth: number;
}

interface Transaction {
  id: string;
  wallet_address: string;
  username: string;
  nft_image_url: string;
  tx_hash: string;
  ta_balance_at_mint: number;
  minted_at: string;
}

export function TANFTMinterPro() {
  const { address, isConnected, status } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { connect } = useConnect();

  const [step, setStep] = useState<Step>("connect");
  const [activeTab, setActiveTab] = useState<TabType>("mint");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [username, setUsername] = useState("");
  const [pfpUrl, setPfpUrl] = useState<string | null>(null);
  const [taBalance, setTaBalance] = useState(0);
  const [nftImageUrl, setNftImageUrl] = useState<string | null>(null);
  const [txHash, setTxHash] = useState("");

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recentMints, setRecentMints] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userCasts, setUserCasts] = useState<any[]>([]);
  const [inputMethod, setInputMethod] = useState<"wallet" | "username">("wallet");
  const [inputUsername, setInputUsername] = useState("");
  const [stats, setStats] = useState({
    totalMints: 0,
    totalVolume: 0,
  });

  // Fetch leaderboard & transactions
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/get-leaderboard");
        const data = await res.json();

        if (data.success) {
          setLeaderboard(data.leaderboard);
          setTransactions(data.recentTransactions);
          setRecentMints(data.recentMints || []);
          setStats({
            totalMints: data.totalMints,
            totalVolume: data.totalVolume,
          });
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const checkUser = async () => {
    if (!address || !username) {
      setError("Connect wallet and enter username");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          farcasterUsername: username,
          pfpUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setTaBalance(data.user.taBalance);
      setStep("generate");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const generateNFT = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/generate-ta-nft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pfpUrl,
          username,
          taBalance,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setNftImageUrl(data.nftImage);
      setStep("preview");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const mintNFT = async () => {
    if (!address || !nftImageUrl || !walletClient) {
      setError("Missing required data");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/mint-ta-nft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          nftImageUrl,
          username,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const hash = await walletClient.sendTransaction({
        to: data.transaction.to as `0x${string}`,
        value: data.transaction.value,
        account: address,
      });

      setTxHash(hash);
      await publicClient?.waitForTransactionReceipt({ hash });

      await fetch("/api/record-mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          username,
          nftImageUrl,
          txHash: hash,
          taBalance,
        }),
      });

      setStep("success");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 relative overflow-hidden">
      {/* Floating gradient background effects */}
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.3),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(255,107,237,0.2),transparent_50%)]"
        animate={shouldReduceMotion ? {} : {
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-white/20 bg-black/40 backdrop-blur-2xl sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">Table d'Adrian</h1>
            <p className="text-sm text-slate-600">TA NFT Generator</p>
          </div>

          <div className="flex-shrink-0 ml-6">
            {!isConnected ? (
              <button
                onClick={() => connect({ connector: injected() })}
                className="px-6 py-2.5 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                Connect Wallet
              </button>
            ) : (
              <div className="flex items-center gap-3 bg-slate-50 rounded-lg px-4 py-2.5 border border-slate-200">
                {userProfile?.pfpUrl ? (
                  // User checked DNA - show profile pic + username + short address
                  <>
                    <img
                      src={userProfile.pfpUrl}
                      alt={userProfile.username}
                      className="w-10 h-10 rounded-full border-2 border-slate-300 object-cover"
                    />
                    <div className="text-right">
                      <p className="text-xs font-semibold text-slate-900">
                        @{userProfile.username}
                      </p>
                      <p className="text-xs text-slate-600 font-mono">
                        {address?.substring(0, 5)}...
                      </p>
                    </div>
                  </>
                ) : (
                  // User just connected - show short address
                  <div className="text-right">
                    <p className="text-xs text-slate-600">Connected</p>
                    <p className="text-sm font-mono font-semibold text-slate-900">
                      {address?.substring(0, 5)}...
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.header>

      {/* SHOWCASE GALLERY - NEW */}
      {recentMints.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-black/20 backdrop-blur-xl border-b border-white/10 px-6 py-12"
        >
          <div className="max-w-7xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl font-bold text-white mb-8"
            >
              Recent Mints
            </motion.h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {recentMints.map((mint) => (
                <div
                  key={mint.id}
                  className="bg-white rounded-lg overflow-hidden border border-slate-200 hover:shadow-lg transition-shadow"
                >
                  {/* NFT Image */}
                  <div className="aspect-square bg-slate-100 overflow-hidden">
                    <img
                      src={mint.nft_image_url}
                      alt={`${mint.username}'s TA NFT`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </div>
                  
                  {/* Info */}
                  <div className="p-4">
                    <p className="font-semibold text-slate-900 text-sm mb-1">
                      {mint.username}
                    </p>
                    <p className="text-xs text-slate-600 mb-2">
                      {new Date(mint.minted_at).toLocaleDateString()} at{" "}
                      {new Date(mint.minted_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <a
                      href={`https://basescan.io/tx/${mint.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-600 hover:text-slate-900 font-mono break-all"
                    >
                      {mint.tx_hash.substring(0, 16)}...
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left: Mint Form & Preview */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-black/40 backdrop-blur-2xl border border-white/20 rounded-2xl p-8 shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]"
            >
              {step === "connect" && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-6">
                    Mint Your TA NFT
                  </h2>
                  {!isConnected ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
                      <p className="text-sm text-slate-600 mb-4">
                        Connect your wallet to begin
                      </p>
                      <button
                        onClick={() => connect({ connector: injected() })}
                        className="w-full px-4 py-2.5 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        Connect Wallet
                      </button>
                    </div>
                  ) : (
                    <>
                      {!userProfile ? (
                        // Before checking DNA: Show input method selection and button
                        <div>
                          {/* Input Method Selection */}
                          <div className="mb-4">
                            <div className="flex gap-2 mb-3">
                              <button
                                onClick={() => setInputMethod("wallet")}
                                className={`px-3 py-1 text-xs rounded ${
                                  inputMethod === "wallet"
                                    ? "bg-slate-900 text-white"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                Use Wallet
                              </button>
                              <button
                                onClick={() => setInputMethod("username")}
                                className={`px-3 py-1 text-xs rounded ${
                                  inputMethod === "username"
                                    ? "bg-slate-900 text-white"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                Enter Username
                              </button>
                            </div>

                            {inputMethod === "username" && (
                              <input
                                type="text"
                                placeholder="Enter your Farcaster username (without @)"
                                value={inputUsername}
                                onChange={(e) => setInputUsername(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                              />
                            )}
                          </div>

                          {/* Check DNA Button */}
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={async () => {
                              setLoading(true);
                              setError("");

                              try {
                                const requestBody: any = {};
                                
                                if (inputMethod === "wallet") {
                                  if (!address) {
                                    throw new Error("Please connect your wallet first");
                                  }
                                  requestBody.walletAddress = address;
                                } else {
                                  if (!inputUsername.trim()) {
                                    throw new Error("Please enter your Farcaster username");
                                  }
                                  requestBody.farcasterUsername = inputUsername.trim();
                                }

                                let apiUrl = "/api/fetch-farcaster-user?";
                                
                                if (inputMethod === "wallet") {
                                  apiUrl += `wallet=${address}`;
                                } else {
                                  apiUrl += `username=${inputUsername.trim()}`;
                                }

                                const res = await fetch(apiUrl, {
                                  method: "GET",
                                  headers: { "Content-Type": "application/json" },
                                });

                                const data = await res.json();

                                if (!res.ok) throw new Error(data.error);

                                setUserProfile(data.user);
                                setUserCasts(data.casts);
                                setUsername(data.user.username);
                                setTaBalance(0); // Will be fetched in check-user
                              } catch (err) {
                                setError((err as Error).message);
                              } finally {
                                setLoading(false);
                              }
                            }}
                            disabled={loading || (inputMethod === "username" && !inputUsername.trim())}
                            className="w-full rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-size-200 bg-pos-0 hover:bg-pos-100 p-[2px] transition-all duration-500 group/button"
                          >
                            <div className="rounded-xl bg-slate-900 px-6 py-4 transition-colors group-hover/button:bg-transparent">
                              <span className="font-bold text-white text-lg tracking-wide">
                                {loading ? "Checking DNA..." : "Check DNA ✨"}
                              </span>
                            </div>
                          </motion.button>
                        </div>
                      ) : (
                        // After checking DNA: Show user profile + casts
                        <>
                          {/* User Profile Card */}
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                            <div className="flex items-start gap-4">
                              {/* PFP */}
                              <img
                                src={userProfile.pfpUrl}
                                alt={userProfile.username}
                                className="w-16 h-16 rounded-full border-2 border-slate-200"
                              />

                              {/* User Info */}
                              <div className="flex-1">
                                <p className="font-bold text-slate-900">
                                  @{userProfile.username}
                                </p>
                                <p className="text-sm text-slate-600 mb-2">
                                  {userProfile.displayName}
                                </p>
                                {userProfile.bio && (
                                  <p className="text-xs text-slate-600 mb-2">
                                    {userProfile.bio}
                                  </p>
                                )}
                                <div className="flex gap-4 text-xs text-slate-600">
                                  <span>{userProfile.followerCount} followers</span>
                                  <span>{userProfile.followingCount} following</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Recent Casts */}
                          {userCasts.length > 0 && (
                            <div className="mb-6">
                              <p className="text-xs font-semibold text-slate-600 mb-3">
                                Recent Casts
                              </p>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {userCasts.map((cast) => (
                                  <div
                                    key={cast.hash}
                                    className="bg-slate-50 border border-slate-100 rounded p-3 text-xs"
                                  >
                                    <p className="text-slate-900 mb-1 line-clamp-2">
                                      {cast.text}
                                    </p>
                                    <div className="flex gap-3 text-slate-600">
                                      <span>❤️ {cast.likeCount}</span>
                                      <span>💬 {cast.replyCount}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Confirm and Continue Button */}
                          <button
                            onClick={async () => {
                              setLoading(true);
                              setError("");

                              try {
                                const res = await fetch(`/api/fetch-farcaster-user?username=${userProfile.username}`, {
                                  method: "GET",
                                  headers: { "Content-Type": "application/json" },
                                });

                                const data = await res.json();
                                if (!res.ok) throw new Error(data.error);

                                setTaBalance(data.user.taBalance);
                                setStep("generate");
                              } catch (err) {
                                setError((err as Error).message);
                              } finally {
                                setLoading(false);
                              }
                            }}
                            disabled={loading}
                            className="w-full px-4 py-2.5 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
                          >
                            {loading ? "Checking..." : "Confirm & Generate NFT"}
                          </button>

                          {/* Change User Button */}
                          <button
                            onClick={() => {
                              setUserProfile(null);
                              setUserCasts([]);
                              setUsername("");
                            }}
                            className="w-full px-4 py-2.5 mt-3 text-slate-600 border border-slate-200 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            Change User
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}

              {step === "generate" && (
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-6">
                    Generate TA NFT
                  </h2>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 text-sm">
                    <p className="text-slate-900 font-semibold mb-1">
                      {username}
                    </p>
                    <p className="text-slate-600">
                      TA Balance: {taBalance.toFixed(2)} tokens
                    </p>
                  </div>

                  <button
                    onClick={generateNFT}
                    disabled={loading}
                    className="w-full px-4 py-2.5 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
                  >
                    {loading ? "Generating..." : "Generate NFT with AI"}
                  </button>
                </div>
              )}

              {step === "preview" && nftImageUrl && (
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-6">
                    Your TA NFT
                  </h2>
                  <div className="mb-6 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 aspect-square">
                    <img
                      src={nftImageUrl}
                      alt={`TA NFT ${username}`}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 text-sm">
                    <p className="font-semibold text-slate-900">
                      TA NFT: {username}
                    </p>
                    <p className="text-slate-600 text-xs">
                      Table d'Adrian Collection
                    </p>
                  </div>

                  <button
                    onClick={mintNFT}
                    disabled={loading}
                    className="w-full px-4 py-2.5 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
                  >
                    {loading ? "Processing..." : "Mint (0.003 ETH)"}
                  </button>
                </div>
              )}

              {step === "success" && (
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-6">
                    Successfully Minted
                  </h2>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
                    <p className="font-semibold text-slate-900 mb-2">
                      {username}
                    </p>
                    <p className="text-xs text-slate-600 mb-3">
                      0.003 ETH to liquidity pool
                    </p>
                    <p className="text-xs font-mono text-slate-700 break-all">
                      {txHash.substring(0, 30)}...
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setStep("connect");
                      setUsername("");
                      setPfpUrl(null);
                      setNftImageUrl(null);
                      setTxHash("");
                      setUserProfile(null);
                      setUserCasts([]);
                    }}
                    className="w-full px-4 py-2.5 mt-4 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    Mint Another
                  </button>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 mt-4">
                  {error}
                </div>
              )}
            </motion.div>
          </div>

          {/* Right: Dashboard */}
          <div className="lg:col-span-2">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-6 mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="border border-white/20 bg-black/40 backdrop-blur-2xl rounded-xl p-6"
              >
                <p className="text-sm text-gray-400 mb-1">Total Mints</p>
                <p className="text-3xl font-bold text-white">
                  {stats.totalMints}
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="border border-white/20 bg-black/40 backdrop-blur-2xl rounded-xl p-6"
              >
                <p className="text-sm text-gray-400 mb-1">Total Volume</p>
                <p className="text-3xl font-bold text-white">
                  {stats.totalVolume.toFixed(3)} ETH
                </p>
              </motion.div>
            </div>

            {/* Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="border border-white/20 bg-black/40 backdrop-blur-2xl rounded-2xl overflow-hidden"
            >
              <div className="flex border-b border-white/20">
                <button
                  onClick={() => setActiveTab("leaderboard")}
                  className={`flex-1 px-6 py-4 font-semibold text-sm transition-colors ${
                    activeTab === "leaderboard"
                      ? "text-white border-b-2 border-purple-500"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Leaderboard
                </button>
                <button
                  onClick={() => setActiveTab("transactions")}
                  className={`flex-1 px-6 py-4 font-semibold text-sm transition-colors ${
                    activeTab === "transactions"
                      ? "text-white border-b-2 border-purple-500"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Transactions
                </button>
              </div>

              <div className="p-6">
                {/* Leaderboard Tab */}
                {activeTab === "leaderboard" && (
                  <div className="space-y-3">
                    {leaderboard.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-8">
                        No mints yet
                      </p>
                    ) : (
                      leaderboard.map((entry, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * idx }}
                          className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                              <span className="text-xs font-bold text-white">
                                {idx + 1}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">
                                {entry.username}
                              </p>
                              <p className="text-xs text-gray-400 font-mono">
                                {entry.wallet.substring(0, 10)}...
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-white">
                              {entry.count} NFTs
                            </p>
                            <p className="text-xs text-gray-400">
                              {entry.totalEth.toFixed(3)} ETH
                            </p>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                )}

                {/* Transactions Tab */}
                {activeTab === "transactions" && (
                  <div className="space-y-3">
                    {transactions.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-8">
                        No transactions yet
                      </p>
                    ) : (
                      transactions.map((tx) => (
                        <motion.div
                          key={tx.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors"
                        >
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {tx.username}
                            </p>
                            <p className="text-xs text-gray-400 font-mono">
                              {tx.tx_hash.substring(0, 12)}...
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-white">
                              0.003 ETH
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(tx.minted_at).toLocaleDateString()}
                            </p>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}