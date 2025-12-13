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

      setStep("success");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
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
              <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg text-center">
                <p className="font-bold mb-2">TA NFT Minted</p>
                <p className="text-sm mb-4">{username}</p>
                <p className="text-xs mb-2">0.001 ETH sent to TANFT Contract</p>
                <p className="text-xs text-green-600 font-mono">
                  TX: {txHash.substring(0, 20)}...
                </p>
              </div>
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