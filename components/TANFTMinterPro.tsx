"use client";

import { useState, useEffect } from "react";
import { useAccount, useConnect, useWalletClient, usePublicClient } from "wagmi";
import { injected } from "wagmi/connectors";
import { sdk } from "@farcaster/miniapp-sdk";
import { getWalletClient } from "@wagmi/core";
import { config } from "@/app/providers";

type Step = "connect" | "fetch" | "generate" | "preview" | "minting" | "success";

export default function TANFTMinterPro() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  
  const [step, setStep] = useState<Step>("connect");
  const [userData, setUserData] = useState<any>(null);
  const [nftImageUrl, setNftImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");
  const [usernameInput, setUsernameInput] = useState("");

  // Initialize Farcaster SDK
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        await sdk.actions.ready();
      } catch (err) {
        console.error('Failed to initialize Farcaster SDK:', err);
      }
    };
    initializeSDK();
  }, []);

  // Don't auto-fetch on connect - wait for user to click mint button

  const fetchUserData = async (walletOrUsername: string, isUsername = false) => {
    setLoading(true);
    setError("");
    setStep("fetch");
    
    try {
      const apiUrl = isUsername 
        ? `/api/fetch-farcaster-user?username=${encodeURIComponent(walletOrUsername)}`
        : `/api/fetch-farcaster-user?wallet=${walletOrUsername}`;
      
      const res = await fetch(apiUrl);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Request failed' }));
        setError(errorData.error || `Request failed with status ${res.status}`);
        setLoading(false);
        setStep("connect");
        return;
      }
      
      const data = await res.json();
      setUserData(data);
      
      // Automatically generate NFT from PFP
      if (data.pfp_url) {
        await generateNFT(data.pfp_url, data.username);
      } else {
        setError('No profile picture found. Please ensure your Farcaster profile has a PFP.');
        setLoading(false);
        setStep("connect");
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err instanceof Error ? err.message : 'Connection failed');
      setLoading(false);
      setStep("connect");
    }
  };

  const generateNFT = async (pfpUrl: string, username: string) => {
    setLoading(true);
    setError("");
    setStep("generate");
    
    try {
      const res = await fetch("/api/generate-ta-nft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pfpUrl,
          username,
          taBalance: 0, // Will be checked during mint if needed
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "NFT generation failed");
      }

      setNftImageUrl(data.nftImage);
      setStep("preview");
    } catch (err) {
      console.error('Error generating NFT:', err);
      setError(err instanceof Error ? err.message : 'NFT generation failed');
      setStep("connect");
    } finally {
      setLoading(false);
    }
  };

  const mintNFT = async () => {
    if (!address || !isConnected) {
      setError("Please connect your wallet first");
      return;
    }

    setLoading(true);
    setError("");

    // Get wallet client - use the hook value or wait a moment
    let client = walletClient;
    
    // If walletClient is not ready, wait a bit for it to initialize
    if (!client) {
      // Wait up to 2 seconds for wallet client to be ready
      for (let i = 0; i < 20; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        // Re-check if walletClient is now available (it updates via hook)
        // We'll use the hook value directly below
      }
      client = walletClient; // Re-check after waiting
    }

    if (!client) {
      setError("Wallet not ready. Please make sure MetaMask is connected to Base network and refresh the page.");
      setLoading(false);
      return;
    }

    // If we don't have user data yet, fetch it automatically from wallet
    if (!userData || !nftImageUrl) {
      try {
        setStep("fetch");
        // Fetch user data from wallet
        const userRes = await fetch(`/api/fetch-farcaster-user?wallet=${address}`);
        
        if (!userRes.ok) {
          const errorData = await userRes.json().catch(() => ({ error: 'Request failed' }));
          throw new Error(errorData.error || 'Could not fetch your Farcaster profile');
        }
        
        const fetchedUserData = await userRes.json();
        setUserData(fetchedUserData);
        
        // Generate NFT from PFP if we don't have one yet
        if (!nftImageUrl && fetchedUserData.pfp_url) {
          setStep("generate");
          await generateNFT(fetchedUserData.pfp_url, fetchedUserData.username);
        } else if (!fetchedUserData.pfp_url) {
          throw new Error('No profile picture found. Please ensure your Farcaster profile has a PFP.');
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch profile');
        setLoading(false);
        setStep("connect");
        return;
      }
    }

    // Now proceed with minting
    if (!nftImageUrl || !userData) {
      setError("Failed to generate NFT. Please try again.");
      setLoading(false);
      setStep("connect");
      return;
    }

    setStep("minting");

    try {
      // Fetch user's recent cast for sharing
      let castData = null;
      try {
        const castsRes = await fetch(`/api/fetch-user-casts?fid=${userData.fid}`);
        if (castsRes.ok) {
          const castsData = await castsRes.json();
          if (castsData.casts && castsData.casts.length > 0) {
            const recentCast = castsData.casts[0];
            castData = {
              text: recentCast.text,
              hash: recentCast.hash,
              timestamp: recentCast.timestamp,
            };
          }
        }
      } catch (err) {
        console.log('Could not fetch cast data:', err);
      }

      // Get transaction data
      const res = await fetch("/api/mint-ta-nft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          nftImageUrl,
          username: userData.username,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Mint preparation failed");
      }

      // Send transaction - 0.003 ETH to liquidity pool on Base chain
      const hash = await client.sendTransaction({
        to: data.transaction.to as `0x${string}`,
        value: data.transaction.value, // 0.003 ETH
        account: address as `0x${string}`,
      });

      setTxHash(hash);

      // Wait for confirmation
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      // Record mint in database with cast data
      await fetch("/api/record-mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          username: userData.username,
          nftImageUrl,
          txHash: hash,
          taBalance: 0,
          castText: castData?.text || null,
          castHash: castData?.hash || null,
          castTimestamp: castData?.timestamp || null,
          pfpUrl: userData.pfp_url || null,
        }),
      });

      setStep("success");
    } catch (err) {
      console.error('Error minting NFT:', err);
      setError(err instanceof Error ? err.message : 'Minting failed');
      setStep("preview");
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameSubmit = () => {
    if (!usernameInput.trim()) {
      setError('Please enter a username');
      return;
    }
    fetchUserData(usernameInput.trim(), true);
  };

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="border-4 border-black p-4 sm:p-6 mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-2">TABLE D'ADRIAN</h1>
          <p className="text-sm sm:text-base md:text-lg">Exclusive DeSci NFT Collection</p>
        </div>

        {/* Main Card */}
        <div className="border-4 border-black p-4 sm:p-6 md:p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          
          {/* Step: Connect Wallet */}
          {step === "connect" && (
            <>
              {!isConnected ? (
                <button
                  onClick={() => connect({ connector: injected() })}
                  className="w-full bg-black text-white border-2 border-black p-3 sm:p-4 text-base sm:text-lg font-black
                           hover:bg-white hover:text-black transition-all duration-200
                           active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                           mb-4"
                >
                  CONNECT WALLET
                </button>
              ) : (
                <div className="border-2 border-black p-3 sm:p-4 bg-green-100 mb-4">
                  <div className="flex justify-between items-center gap-2">
                    <div className="font-bold text-sm sm:text-base">WALLET CONNECTED</div>
                    <div className="font-mono text-xs sm:text-sm truncate">
                      {address?.substring(0, 6)}...{address?.substring(address.length - 4)}
                    </div>
                  </div>
                </div>
              )}

              {/* Info Grid */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
                <div className="border-2 border-black p-2 sm:p-4">
                  <div className="text-xs sm:text-sm font-bold mb-1">PRICE</div>
                  <div className="text-lg sm:text-xl md:text-2xl font-black">0.003 ETH</div>
                </div>
                <div className="border-2 border-black p-2 sm:p-4">
                  <div className="text-xs sm:text-sm font-bold mb-1">SUPPLY</div>
                  <div className="text-lg sm:text-xl md:text-2xl font-black">1,000</div>
                </div>
                <div className="border-2 border-black p-2 sm:p-4">
                  <div className="text-xs sm:text-sm font-bold mb-1">CHAIN</div>
                  <div className="text-lg sm:text-xl md:text-2xl font-black">BASE</div>
                </div>
              </div>

              {/* Description */}
              <div className="border-2 border-black p-3 sm:p-4 mb-6 sm:mb-8 bg-gray-50">
                <p className="text-xs sm:text-sm">
                  Mint a $tabledadrian NFT generated from your Farcaster profile picture. All fees (0.003 ETH) go to the LP of the token.
                </p>
              </div>

              {/* Main Mint Button - Auto-fetches user data */}
              {isConnected && (
                <button
                  onClick={mintNFT}
                  disabled={loading}
                  className="w-full bg-black text-white border-4 border-black p-4 sm:p-6 text-lg sm:text-xl font-black
                           hover:bg-white hover:text-black transition-all duration-200
                           active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                           disabled:opacity-50 text-center"
                >
                  {loading ? 'LOADING...' : 'MINT NFT (0.003 ETH)'}
                </button>
              )}
            </>
          )}

          {/* Step: Fetching User Data */}
          {(step === "fetch" || step === "generate") && (
            <div className="text-center py-6 sm:py-8">
              <div className="text-xl sm:text-2xl font-black mb-4">
                {step === "fetch" ? "FETCHING YOUR PROFILE..." : "GENERATING YOUR NFT..."}
              </div>
              {userData && (
                <div className="border-2 border-black p-3 sm:p-4 mb-4 bg-yellow-100">
                  <div className="flex items-center gap-3 sm:gap-4 justify-center flex-wrap">
                    {userData.pfp_url && (
                      <img 
                        src={userData.pfp_url} 
                        alt="Profile" 
                        className="w-12 h-12 sm:w-16 sm:h-16 border-2 border-black rounded-full"
                      />
                    )}
                    <div>
                      <div className="font-bold text-base sm:text-lg">@{userData.username}</div>
                      <div className="text-xs sm:text-sm">FID: {userData.fid}</div>
                    </div>
                  </div>
                </div>
              )}
              <div className="text-xs sm:text-sm text-gray-600 px-4">Using AI to transform your PFP into a luxury chef NFT...</div>
            </div>
          )}

          {/* Step: Preview NFT */}
          {step === "preview" && nftImageUrl && userData && (
            <div>
              <div className="text-center mb-4 sm:mb-6">
                <h2 className="text-2xl sm:text-3xl font-black mb-2">YOUR TA NFT IS READY!</h2>
                <p className="text-xs sm:text-sm text-gray-600">Generated from your Farcaster profile</p>
              </div>

              {/* NFT Preview */}
              <div className="border-4 border-black mb-4 sm:mb-6 bg-gray-100 aspect-square overflow-hidden">
                <img
                  src={nftImageUrl}
                  alt={`TA NFT ${userData.username}`}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* NFT Info */}
              <div className="border-2 border-black p-3 sm:p-4 mb-4 sm:mb-6 bg-yellow-100">
                <div className="font-bold text-base sm:text-lg mb-2">TA NFT: @{userData.username}</div>
                <div className="text-xs sm:text-sm mb-1">Collection: Table d'Adrian DeSci Collection</div>
                <div className="text-xs sm:text-sm font-bold">Price: 0.003 ETH → Liquidity Pool</div>
              </div>

              {/* Mint Button */}
              <button
                onClick={mintNFT}
                disabled={loading || !isConnected}
                className="w-full bg-black text-white border-4 border-black p-4 sm:p-6 text-lg sm:text-xl font-black
                         hover:bg-white hover:text-black transition-all duration-200
                         active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                         disabled:opacity-50"
              >
                {loading ? 'PREPARING MINT...' : 'MINT NFT (0.003 ETH)'}
              </button>
            </div>
          )}

          {/* Step: Minting */}
          {step === "minting" && (
            <div className="text-center py-6 sm:py-8">
              <div className="text-xl sm:text-2xl font-black mb-4">MINTING YOUR NFT...</div>
              <div className="text-xs sm:text-sm text-gray-600">Minting your NFT and sending payment...</div>
              {txHash && (
                <div className="mt-4 p-3 sm:p-4 bg-gray-100 border-2 border-black">
                  <div className="text-xs font-mono break-all">{txHash}</div>
                </div>
              )}
            </div>
          )}

          {/* Step: Success */}
          {step === "success" && (
            <div className="text-center py-6 sm:py-8">
              <div className="text-2xl sm:text-3xl font-black mb-4 text-green-600">NFT MINTED!</div>
              {nftImageUrl && (
                <div className="border-4 border-black mb-4 sm:mb-6 bg-gray-100 aspect-square overflow-hidden">
                  <img
                    src={nftImageUrl}
                    alt="Minted NFT"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="border-2 border-black p-3 sm:p-4 mb-4 sm:mb-6 bg-green-100">
                <div className="font-bold text-base sm:text-lg mb-2">Successfully Minted!</div>
                <div className="text-xs sm:text-sm mb-2">@{userData?.username}</div>
                <div className="text-xs mb-2">NFT minted and owned by you • 0.003 ETH sent to $TA Liquidity Pool</div>
                {txHash && (
                  <div className="text-xs font-mono break-all text-gray-600">
                    TX: {txHash.substring(0, 20)}...{txHash.substring(txHash.length - 10)}
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setStep("connect");
                  setUserData(null);
                  setNftImageUrl(null);
                  setTxHash("");
                  setUsernameInput("");
                }}
                className="w-full bg-black text-white border-2 border-black p-3 sm:p-4 text-base sm:text-lg font-black
                         hover:bg-white hover:text-black transition-all"
              >
                MINT ANOTHER NFT
              </button>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="border-2 border-red-600 bg-red-50 p-3 sm:p-4 mb-4">
              <div className="font-bold text-red-600 text-sm sm:text-base break-words">{error}</div>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && step !== "minting" && (
            <div className="text-center py-4">
              <div className="text-xs sm:text-sm text-gray-600">Processing...</div>
            </div>
          )}

        </div>

        {/* Footer Stats */}
        <div className="mt-6 sm:mt-8 border-4 border-black p-3 sm:p-4 bg-black text-white">
          <div className="text-center">
            <div className="font-bold text-sm sm:text-base">TABLE D'ADRIAN NFT</div>
            <div className="text-xs sm:text-sm mt-1">Powered by Base Network • AI Generated with Replicate</div>
          </div>
        </div>

      </div>
    </div>
  );
}