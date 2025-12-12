"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, useConnect, useWalletClient, usePublicClient } from "wagmi";
import { injected } from "wagmi/connectors";
import { sdk } from "@farcaster/miniapp-sdk";

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

  const generateNFT = useCallback(async (pfpUrl: string, username: string) => {
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
  }, []);

  const fetchUserData = useCallback(async (walletOrUsernameOrFid: string, isUsername = false) => {
    setLoading(true);
    setError("");
    setStep("fetch");
    
    try {
      // Check if it's a numeric FID (FIDs are numbers)
      const isFid = !isNaN(Number(walletOrUsernameOrFid)) && Number(walletOrUsernameOrFid) > 0;
      
      const apiUrl = isFid
        ? `/api/fetch-farcaster-user?fid=${walletOrUsernameOrFid}`
        : isUsername 
        ? `/api/fetch-farcaster-user?username=${encodeURIComponent(walletOrUsernameOrFid)}`
        : `/api/fetch-farcaster-user?wallet=${walletOrUsernameOrFid}`;
      
      console.log('Fetching user data from:', apiUrl);
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
  }, [generateNFT]);

  // Initialize Farcaster SDK and auto-connect wallet
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        await sdk.actions.ready();
        
        // Try to get FID from Farcaster SDK context first (most reliable)
        try {
          const context = await sdk.context;
          console.log('Farcaster context:', context);
          if (context?.user?.fid) {
            const fid = context.user.fid;
            console.log('Got FID from Farcaster context:', fid);
            // Fetch user data by FID (most reliable method)
            if (!userData) {
              await fetchUserData(fid.toString(), false);
            }
            return; // Success, exit early
          } else {
            console.log('No FID in context, context.user:', context?.user);
          }
        } catch (contextErr) {
          console.error('Error getting FID from context:', contextErr);
        }
        
        // Fallback: Get wallet from Ethereum provider
        try {
          const ethereumProvider = await sdk.wallet.getEthereumProvider();
          
          if (ethereumProvider) {
            // Provider is available - try to get accounts
            try {
              // Get accounts without requesting (if already connected)
              let accounts: string[] | null = null;
              try {
                accounts = await ethereumProvider.request({ method: 'eth_accounts' }) as string[];
              } catch (err) {
                // If eth_accounts fails, try requesting
                accounts = await ethereumProvider.request({ method: 'eth_requestAccounts' }) as string[];
              }
              
              if (accounts && accounts.length > 0 && accounts[0]) {
                const walletAddress = accounts[0];
                console.log('Auto-detected wallet from Farcaster:', walletAddress);
                
                // If wallet is connected via wagmi, use that address
                if (isConnected && address && address.toLowerCase() === walletAddress.toLowerCase()) {
                  // Already connected, just fetch user data if we don't have it
                  if (!userData) {
                    await fetchUserData(walletAddress, false);
                  }
                } else if (!isConnected) {
                  // Not connected via wagmi yet, but we have Farcaster wallet
                  // Fetch user data directly using Farcaster wallet address
                  await fetchUserData(walletAddress, false);
                }
              }
            } catch (connectErr) {
              console.log('Auto-connect via Farcaster wallet failed:', connectErr);
            }
          }
        } catch (providerErr) {
          console.log('Farcaster wallet provider not available:', providerErr);
        }
      } catch (err) {
        console.error('Failed to initialize Farcaster SDK:', err);
      }
    };
    initializeSDK();
  }, [isConnected, address, fetchUserData, userData]);

  const mintNFT = async () => {
    setLoading(true);
    setError("");

    // Get wallet address - try Farcaster SDK first, then wagmi
    let walletAddress: string | undefined = address;
    
    try {
      const ethereumProvider = await sdk.wallet.getEthereumProvider();
      if (ethereumProvider) {
        const accounts = await ethereumProvider.request({ method: 'eth_accounts' }) as string[];
        if (accounts && accounts.length > 0) {
          walletAddress = accounts[0] as `0x${string}`;
          console.log('Using wallet from Farcaster SDK:', walletAddress);
        }
      }
    } catch (err) {
      console.log('Could not get wallet from Farcaster SDK');
    }

    if (!walletAddress) {
      setError("Please connect your wallet first");
      setLoading(false);
      return;
    }

    // Check if we can use Farcaster SDK provider first (works with any wallet)
    let canUseFarcasterProvider = false;
    try {
      const ethereumProvider = await sdk.wallet.getEthereumProvider();
      canUseFarcasterProvider = !!ethereumProvider;
    } catch (err) {
      console.log('Farcaster provider not available, will use wagmi client');
    }

    // Get wallet client as fallback - use the hook value or wait a moment
    let client = walletClient;
    
    // If walletClient is not ready and we can't use Farcaster provider, wait a bit
    if (!client && !canUseFarcasterProvider) {
      // Wait up to 2 seconds for wallet client to be ready
      for (let i = 0; i < 20; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        client = walletClient; // Re-check after waiting
        if (client) break;
      }
    }

    // If neither Farcaster provider nor wagmi client is available, show error
    if (!client && !canUseFarcasterProvider) {
      setError("Wallet not ready. Please make sure your wallet is connected to Base network and try again.");
      setLoading(false);
      return;
    }

    // If we don't have user data yet, fetch it automatically from wallet
    if (!userData || !nftImageUrl) {
      try {
        setStep("fetch");
        
        // Try to get FID from Farcaster SDK context first (most reliable)
        let fetchedUserData: any = null;
        
        try {
          const context = await sdk.context;
          console.log('Farcaster context for mint:', context);
          if (context?.user?.fid) {
            const fid = context.user.fid;
            console.log('Got FID from Farcaster context for mint:', fid);
            const userRes = await fetch(`/api/fetch-farcaster-user?fid=${fid}`);
            console.log('FID lookup response status:', userRes.status);
            if (userRes.ok) {
              fetchedUserData = await userRes.json();
              console.log('Fetched user data by FID:', fetchedUserData);
            } else {
              const errorData = await userRes.json().catch(() => ({}));
              console.error('FID lookup failed:', errorData);
            }
          } else {
            console.log('No FID in context for mint, context.user:', context?.user);
          }
        } catch (contextErr) {
          console.error('Error getting FID from context for mint:', contextErr);
        }
        
        // Fallback: Try wallet address
        if (!fetchedUserData) {
          let walletToUse: string | undefined = address;
          
          try {
            const ethereumProvider = await sdk.wallet.getEthereumProvider();
            if (ethereumProvider) {
              const accounts = await ethereumProvider.request({ method: 'eth_accounts' }) as string[];
              if (accounts && accounts.length > 0) {
                walletToUse = accounts[0] as `0x${string}`;
                console.log('Using wallet from Farcaster SDK:', walletToUse);
              }
            }
          } catch (sdkErr) {
            console.log('Could not get wallet from Farcaster SDK, using wagmi address');
          }
          
          if (!walletToUse) {
            throw new Error('No wallet address found. Please connect your wallet.');
          }
          
          const userRes = await fetch(`/api/fetch-farcaster-user?wallet=${walletToUse}`);
          if (!userRes.ok) {
            const errorData = await userRes.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(errorData.error || 'Could not fetch your Farcaster profile');
          }
          fetchedUserData = await userRes.json();
        }
        
        if (!fetchedUserData) {
          throw new Error('Could not fetch your Farcaster profile');
        }
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
          walletAddress: walletAddress,
          nftImageUrl,
          username: userData.username,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Mint preparation failed");
      }

      // Use Farcaster SDK's Ethereum provider for transaction (opens in Farcaster wallet)
      let hash: string;
      
      try {
        const ethereumProvider = await sdk.wallet.getEthereumProvider();
        
        if (ethereumProvider) {
          // Send transaction via Farcaster wallet provider (opens in Farcaster wallet)
          hash = await ethereumProvider.request({
            method: 'eth_sendTransaction',
            params: [{
              from: walletAddress as `0x${string}`,
              to: data.transaction.to,
              value: `0x${data.transaction.value.toString(16)}`,
              data: data.transaction.data || '0x',
              chainId: `0x${data.transaction.chainId.toString(16)}`, // Base chain ID: 8453 = 0x2105
            }],
          }) as string;
          
          setTxHash(hash);
          
          // Wait for confirmation
          if (publicClient) {
            await publicClient.waitForTransactionReceipt({ hash: hash as `0x${string}` });
          }
        } else if (client) {
          // Fallback to regular wallet client
          hash = await client.sendTransaction({
            to: data.transaction.to as `0x${string}`,
            value: data.transaction.value,
            account: walletAddress as `0x${string}`,
          });
          setTxHash(hash);
          if (publicClient) {
            await publicClient.waitForTransactionReceipt({ hash: hash as `0x${string}` });
          }
        } else {
          throw new Error("No wallet provider available");
        }
      } catch (txErr) {
        // Fallback to regular wallet client if Farcaster provider fails
        if (client) {
          hash = await client.sendTransaction({
            to: data.transaction.to as `0x${string}`,
            value: data.transaction.value,
            account: walletAddress as `0x${string}`,
          });
          setTxHash(hash);
          if (publicClient) {
            await publicClient.waitForTransactionReceipt({ hash: hash as `0x${string}` });
          }
      } else {
          throw new Error("Transaction failed: No wallet provider available");
        }
      }

      // Record mint in database with cast data
      await fetch("/api/record-mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: walletAddress,
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

              {/* Manual Username Input (fallback if auto-detect fails) */}
              {error && error.includes('User not found') && (
                <div className="border-2 border-black p-3 sm:p-4 mb-4 bg-yellow-50">
                  <p className="text-xs sm:text-sm mb-3 font-bold">Could not auto-detect your profile. Enter your Farcaster username:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder="yourusername (without @)"
                      className="flex-1 border-2 border-black p-2 text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && handleUsernameSubmit()}
                    />
                    <button
                      onClick={handleUsernameSubmit}
                      disabled={loading || !usernameInput.trim()}
                      className="bg-black text-white border-2 border-black px-4 py-2 text-sm font-bold
                               hover:bg-white hover:text-black transition-all
                               disabled:opacity-50"
                    >
                      FETCH
                    </button>
                  </div>
                </div>
              )}

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