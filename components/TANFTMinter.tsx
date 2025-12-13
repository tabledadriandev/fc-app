"use client";

import { useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { parseEther } from "viem";

type Step = "connect" | "check" | "generate" | "preview" | "mint" | "success";

export function TANFTMinter() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [step, setStep] = useState<Step>("connect");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [username, setUsername] = useState("");
  const [pfpUrl, setPfpUrl] = useState<string | null>(null);
  const [taBalance, setTaBalance] = useState(0);
  const [nftImageUrl, setNftImageUrl] = useState<string | null>(null);
  const [txHash, setTxHash] = useState("");
  const [showCastPopup, setShowCastPopup] = useState(false);
  const [nftMetadata, setNftMetadata] = useState<any>(null);

  // Step 1: Check user DNA + balance
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

  // Step 2: Generate TA NFT portrait
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
      setNftMetadata(data.nftMetadata);
      setStep("preview");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Mint to liquidity pool
  const mintNFT = async () => {
    if (!address || !nftImageUrl || !walletClient) {
      setError("Missing required data");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Get transaction data
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

      // Send transaction
      const hash = await walletClient.sendTransaction({
        to: data.transaction.to as `0x${string}`,
        value: data.transaction.value,
        account: address,
      });

      setTxHash(hash);

      // Wait for confirmation
      await publicClient?.waitForTransactionReceipt({ hash });

      // Record mint
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

      setShowCastPopup(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Farcaster casting
  const handleCast = () => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fc-app-sandy.vercel.app';
    const castMessage = `🚀 Just minted my hyper-hype TA NFT from @${username}!

🌟 This incredible anime-style DeSci character has insane superpowers:
⚡ Quantum Energy Manipulation
🧠 Reality Data Hacking
🌌 Temporal Consciousness Access
💫 Dimensional Reality Surfing

Part of the @tabledadrian DeSci Collection - where science meets cyberpunk!

Mint yours: ${appUrl}/ta-nft

$tabledadrian #DeSci #NFT #Cyberpunk #Anime #TableDadrian`;

    // Create Farcaster cast URL
    const castUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(castMessage)}`;
    window.open(castUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Table d'Adrian</h1>
          <p className="text-slate-300">TA NFT Generator</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-2xl p-8">
          {/* Step: Connect Wallet */}
          {step === "connect" && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Connect Wallet</h2>
              {!isConnected ? (
                <p className="text-red-500 mb-4">
                  Please connect your wallet to continue
                </p>
              ) : (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">
                  <p className="font-bold">Wallet Connected</p>
                  <p className="text-sm">{address?.substring(0, 10)}...</p>
                </div>
              )}

              {isConnected && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-bold mb-2">
                      Farcaster Username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="@yourname"
                      className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-bold mb-2">
                      Profile Picture URL (optional)
                    </label>
                    <input
                      type="text"
                      value={pfpUrl || ""}
                      onChange={(e) => setPfpUrl(e.target.value || null)}
                      placeholder="https://..."
                      className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={checkUser}
                    disabled={loading || !username}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg disabled:opacity-50"
                  >
                    {loading ? "Checking..." : "Check User DNA & PFP"}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Step: Generate */}
          {step === "generate" && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Generate TA NFT Portrait</h2>
              <div className="bg-blue-50 border border-blue-200 px-4 py-3 rounded-lg mb-6">
                <p className="text-sm">
                  <strong>User:</strong> {username}
                </p>
                <p className="text-sm">
                  <strong>TA Balance:</strong> {taBalance.toFixed(2)} tokens
                </p>
              </div>

              <button
                onClick={generateNFT}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg disabled:opacity-50"
              >
                {loading ? "Generating with Replicate AI..." : "Generate TA NFT"}
              </button>
            </div>
          )}

          {/* Step: Preview */}
          {step === "preview" && nftImageUrl && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Your TA NFT Portrait</h2>
              <div className="mb-6 rounded-lg overflow-hidden bg-gray-200 aspect-square">
                <img
                  src={nftImageUrl}
                  alt={`TA NFT ${username}`}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="bg-slate-100 rounded-lg p-4 mb-6">
                <p className="font-bold text-center">TA NFT: {username}</p>
                <p className="text-center text-sm text-slate-600">
                  Table d'Adrian Chef Collection
                </p>
              </div>

              <button
                onClick={mintNFT}
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg disabled:opacity-50"
              >
                {loading
                  ? "Processing Mint..."
                  : "Mint NFT (0.001 ETH to TANFT Contract)"}
              </button>
            </div>
          )}

          {/* Step: Success */}
          {step === "success" && (
            <div>
              <h2 className="text-2xl font-bold mb-4 text-green-600">
                Successfully Minted!
              </h2>
              <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg text-center mb-6">
                <p className="font-bold mb-2">TA NFT Minted</p>
                <p className="text-sm mb-4">{username}</p>
                <p className="text-xs mb-2">0.001 ETH sent to TANFT Contract</p>
                <p className="text-xs text-green-600 font-mono">
                  TX: {txHash.substring(0, 20)}...
                </p>
              </div>

              {!showCastPopup && (
                <button
                  onClick={() => setShowCastPopup(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg"
                >
                  Share on Farcaster 🚀
                </button>
              )}

              {showCastPopup && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-bold mb-4 text-blue-800">
                    Share Your Epic NFT! 🌟
                  </h3>
                  <div className="bg-white rounded-lg p-4 mb-4 border">
                    <p className="text-sm text-gray-700 mb-4">
                      Share your hyper-hype TA NFT on Farcaster and spread the word about the DeSci revolution!
                    </p>
                    
                    {nftMetadata?.traits && (
                      <div className="mb-4">
                        <h4 className="font-bold text-sm mb-2">Your NFT Traits:</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {nftMetadata.traits.slice(0, 6).map((trait: any, index: number) => (
                            <div key={index} className="bg-gray-100 rounded px-2 py-1">
                              <span className="font-medium">{trait.trait_type}:</span> {trait.value}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                      <p className="text-xs text-yellow-800">
                        <strong>SEO Tip:</strong> Include @tabledadrian and $tabledadrian in your cast to reach the community!
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleCast}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg"
                    >
                      Cast on Farcaster 🚀
                    </button>
                    <button
                      onClick={() => setShowCastPopup(false)}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-4 rounded-lg"
                    >
                      Maybe Later
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mt-4">
              {error}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="text-center mt-8 text-slate-300 text-sm">
          <p>Table d'Adrian TA NFT Collection</p>
          <p>Powered by Replicate AI</p>
        </div>
      </div>
    </div>
  );
}