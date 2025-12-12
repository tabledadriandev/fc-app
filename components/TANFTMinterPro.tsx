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
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [currentPhrase, setCurrentPhrase] = useState<string>("");

  const generateNFT = useCallback(async (pfpUrl: string, username: string, casts: any[] = []) => {
    setLoading(true);
    setError("");
    setStep("generate");
    setGenerationProgress(0);
    
    // Fun dev phrases for progress
    const phrases = [
      "Initializing quantum NFT generator...",
      "Downloading your PFP from the blockchain...",
      "Analyzing your DeSci vibes...",
      "Feeding data to the AI hamster wheel...",
      "Converting pixels to pure art...",
      "Applying scientific aesthetic filters...",
      "Summoning Studio Ghibli spirits...",
      "Rendering your DeSci researcher portrait...",
      "Adding premium lab attire...",
      "Polishing the final masterpiece...",
      "Almost there, just buffing the pixels...",
    ];
    
    let currentPhraseIndex = 0;
    const updateProgress = () => {
      if (currentPhraseIndex < phrases.length) {
        setCurrentPhrase(phrases[currentPhraseIndex]);
        setGenerationProgress((currentPhraseIndex + 1) * (100 / phrases.length));
        currentPhraseIndex++;
      }
    };
    
    // Start progress updates
    updateProgress();
    const progressInterval = setInterval(() => {
      if (currentPhraseIndex < phrases.length) {
        updateProgress();
      } else {
        clearInterval(progressInterval);
      }
    }, 2000); // Update every 2 seconds
    
    try {
      const res = await fetch("/api/generate-ta-nft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pfpUrl,
          username,
          casts: casts.slice(0, 5), // Send up to 5 recent casts
          taBalance: 0, // Will be checked during mint if needed
        }),
      });

      const data = await res.json();

      clearInterval(progressInterval);
      setGenerationProgress(100);
      setCurrentPhrase("Generation complete! 🎨");

      if (!res.ok) {
        const errorMsg = data.details || data.message || data.error || "NFT generation failed";
        console.error('NFT generation API error:', { status: res.status, error: data });
        throw new Error(errorMsg);
      }

      if (!data.nftImage) {
        throw new Error("NFT generation returned no image");
      }

      setNftImageUrl(data.nftImage);
      setStep("preview");
    } catch (err) {
      clearInterval(progressInterval);
      console.error('Error generating NFT:', err);
      const errorMessage = err instanceof Error ? err.message : 'NFT generation failed';
      setError(errorMessage);
      setStep("connect");
    } finally {
      setLoading(false);
      setGenerationProgress(0);
      setCurrentPhrase("");
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
        const errorMessage = errorData.error || `Request failed with status ${res.status}`;
        const errorDetails = errorData.details || '';
        console.error('User fetch failed:', { status: res.status, error: errorMessage, details: errorData });
        setError(errorDetails ? `${errorMessage}. ${errorDetails}` : errorMessage);
        setLoading(false);
        setStep("connect");
        return;
      }
      
      const data = await res.json();
      setUserData(data);
      
      // Fetch user's casts for NFT generation
      let castsData = null;
      if (data.fid) {
        try {
          const castsRes = await fetch(`/api/fetch-user-casts?fid=${data.fid}`);
          if (castsRes.ok) {
            castsData = await castsRes.json();
            console.log('Fetched casts:', castsData.casts?.length || 0);
          }
        } catch (castsErr) {
          console.log('Could not fetch casts, continuing without them:', castsErr);
        }
      }
      
      // Automatically generate NFT from PFP and casts
      // Add cache busting to ensure we get the latest PFP
      if (data.pfp_url) {
        const pfpUrlWithCache = data.pfp_url.includes('?') 
          ? `${data.pfp_url}&_t=${Date.now()}` 
          : `${data.pfp_url}?_t=${Date.now()}`;
        console.log('Generating NFT with PFP URL:', pfpUrlWithCache);
        await generateNFT(pfpUrlWithCache, data.username, castsData?.casts || []);
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
    let mounted = true;
    
    const initializeSDK = async () => {
      try {
        await sdk.actions.ready();
        
        if (!mounted) return;
        
        // Try to get FID from Farcaster SDK context first (most reliable)
        try {
          // Try different ways to access context
          let context: any = null;
          
          // Method 1: Direct access
          try {
            context = await sdk.context;
          } catch (e) {
            // Method 2: Check if it's a property
            context = (sdk as any).context;
          }
          
          // Method 3: Check window.frame.sdk
          if (!context && typeof window !== 'undefined' && (window as any).frame?.sdk) {
            try {
              context = await (window as any).frame.sdk.context;
            } catch (e) {
              context = (window as any).frame.sdk.context;
            }
          }
          
          console.log('Farcaster context:', context);
          
          if (context?.user?.fid && mounted) {
            const fid = context.user.fid;
            console.log('Got FID from Farcaster context:', fid);
            // Fetch user data by FID (most reliable method)
            if (!userData && mounted) {
              await fetchUserData(fid.toString(), false);
            }
            return; // Success, exit early
          } else {
            console.log('No FID in context, context.user:', context?.user);
          }
        } catch (contextErr) {
          console.error('Error getting FID from context:', contextErr);
        }
        
        if (!mounted) return;
        
        // Fallback: Get wallet from Ethereum provider
        try {
          const ethereumProvider = await sdk.wallet.getEthereumProvider();
          
          if (ethereumProvider && mounted) {
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
              
              if (accounts && accounts.length > 0 && accounts[0] && mounted) {
                const walletAddress = accounts[0];
                console.log('Auto-detected wallet from Farcaster:', walletAddress);
                
                // If wallet is connected via wagmi, use that address
                if (isConnected && address && address.toLowerCase() === walletAddress.toLowerCase()) {
                  // Already connected, just fetch user data if we don't have it
                  if (!userData && mounted) {
                    await fetchUserData(walletAddress, false);
                  }
                } else if (!isConnected && mounted) {
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
    
    // Use setTimeout to avoid state updates during render
    const timeoutId = setTimeout(() => {
      initializeSDK();
    }, 0);
    
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [isConnected, address]); // Removed fetchUserData and userData from dependencies to avoid infinite loops

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
          // Try different ways to access context
          let context: any = null;
          
          try {
            context = await sdk.context;
          } catch (e) {
            context = (sdk as any).context;
          }
          
          if (!context && typeof window !== 'undefined' && (window as any).frame?.sdk) {
            try {
              context = await (window as any).frame.sdk.context;
            } catch (e) {
              context = (window as any).frame.sdk.context;
            }
          }
          
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
              console.error('FID lookup failed:', { status: userRes.status, error: errorData });
              // Don't throw here, try wallet fallback
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
          console.log('Wallet lookup response status:', userRes.status);
          if (!userRes.ok) {
            const errorData = await userRes.json().catch(() => ({ error: 'Request failed' }));
            console.error('Wallet lookup failed:', { status: userRes.status, error: errorData });
            throw new Error(errorData.details ? `${errorData.error}. ${errorData.details}` : (errorData.error || 'Could not fetch your Farcaster profile'));
          }
          fetchedUserData = await userRes.json();
          console.log('Fetched user data by wallet:', fetchedUserData);
        }
        
        if (!fetchedUserData) {
          throw new Error('Could not fetch your Farcaster profile');
        }
        setUserData(fetchedUserData);
        
        // Fetch casts for NFT generation
        let castsData = null;
        if (fetchedUserData.fid) {
          try {
            const castsRes = await fetch(`/api/fetch-user-casts?fid=${fetchedUserData.fid}`);
            if (castsRes.ok) {
              castsData = await castsRes.json();
            }
          } catch (castsErr) {
            console.log('Could not fetch casts:', castsErr);
          }
        }
        
        // Generate NFT from PFP and casts if we don't have one yet
        // Add cache busting to ensure we get the latest PFP
        if (!nftImageUrl && fetchedUserData.pfp_url) {
          setStep("generate");
          const pfpUrlWithCache = fetchedUserData.pfp_url.includes('?') 
            ? `${fetchedUserData.pfp_url}&_t=${Date.now()}` 
            : `${fetchedUserData.pfp_url}?_t=${Date.now()}`;
          console.log('Generating NFT with PFP URL (mint flow):', pfpUrlWithCache);
          await generateNFT(pfpUrlWithCache, fetchedUserData.username, castsData?.casts || []);
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
      const errorMsg = error || "Failed to generate NFT. Please try again.";
      setError(errorMsg);
      setLoading(false);
      setStep("connect");
      return;
    }

    setStep("minting");

    try {
      // Ensure SDK is ready before proceeding
      try {
        await sdk.actions.ready();
        console.log('Farcaster SDK is ready');
      } catch (sdkReadyErr) {
        console.log('SDK ready check:', sdkReadyErr);
        // Continue anyway, SDK might already be ready
      }

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
      
      console.log('Transaction data prepared:', data.transaction);

      // Use Farcaster SDK's Ethereum provider for transaction (opens in Farcaster wallet)
      let hash: string | undefined;
      
      try {
        // Always try Farcaster SDK provider first (this opens the modal)
        let ethereumProvider = null;
        try {
          // Ensure SDK is ready
          await sdk.actions.ready();
          console.log('SDK ready, getting Ethereum provider...');
          
          ethereumProvider = await sdk.wallet.getEthereumProvider();
          console.log('Farcaster SDK provider available:', !!ethereumProvider);
          
          if (!ethereumProvider) {
            throw new Error('Farcaster wallet provider not available');
          }
        } catch (sdkErr: any) {
          console.error('Could not get Farcaster SDK provider:', sdkErr);
          throw new Error(`Farcaster wallet not available: ${sdkErr?.message || 'Please make sure you are using the Farcaster app'}`);
        }
        
        if (ethereumProvider) {
          console.log('Using Farcaster SDK provider for transaction');
          
          // First, request accounts to ensure wallet is connected (this opens the modal if needed)
          let accounts: string[] = [];
          try {
            console.log('Requesting accounts via Farcaster SDK (this may open wallet modal)...');
            accounts = await ethereumProvider.request({ method: 'eth_requestAccounts' }) as string[];
            console.log('Accounts received:', accounts);
            
            if (!accounts || accounts.length === 0) {
              // Try eth_accounts as fallback (doesn't open modal, but checks if already connected)
              console.log('No accounts from eth_requestAccounts, trying eth_accounts...');
              accounts = await ethereumProvider.request({ method: 'eth_accounts' }) as string[];
              console.log('Accounts from eth_accounts:', accounts);
              
              if (!accounts || accounts.length === 0) {
                throw new Error('No wallet connected. Please connect your wallet in the Farcaster app first.');
              }
            }
            
            // Update wallet address from the connected account
            walletAddress = accounts[0] as `0x${string}`;
            console.log('Wallet address from Farcaster SDK:', walletAddress);
          } catch (requestErr: any) {
            console.error('Error requesting accounts:', requestErr);
            const errorMsg = requestErr?.message || 'Unknown error';
            if (errorMsg.includes('rejected') || errorMsg.includes('denied') || requestErr?.code === 4001) {
              throw new Error('Wallet connection was rejected. Please try again and approve the connection.');
            }
            throw new Error(`Failed to connect wallet: ${errorMsg}`);
          }
          
          // Ensure value is properly formatted as hex string
          // The API now returns value as a hex string, but we need to handle both formats
          let valueWithPrefix: `0x${string}`;
          
          if (typeof data.transaction.value === 'string' && data.transaction.value.startsWith('0x')) {
            // Already a hex string
            valueWithPrefix = data.transaction.value as `0x${string}`;
          } else {
            // Convert BigInt or string to hex
            const valueBigInt = typeof data.transaction.value === 'string' 
              ? BigInt(data.transaction.value) 
              : BigInt(data.transaction.value);
            const valueHex = valueBigInt.toString(16);
            valueWithPrefix = (valueHex.startsWith('0x') ? valueHex : `0x${valueHex}`) as `0x${string}`;
          }
          
          // Format chain ID as hex (Base = 8453 = 0x2105)
          const chainIdHex = `0x${data.transaction.chainId.toString(16)}` as `0x${string}`;
          
          // Build transaction params - let wallet auto-estimate gas
          // Farcaster provider doesn't support eth_estimateGas, so we let the wallet handle it
          const txParams: any = {
            from: walletAddress as `0x${string}`,
            to: data.transaction.to as `0x${string}`,
            value: valueWithPrefix,
            data: data.transaction.data || '0x',
            chainId: chainIdHex,
            // Don't set gas - let wallet auto-estimate
          };
          
          console.log('Sending transaction via Farcaster SDK:', txParams);
          
          // Send transaction via Farcaster wallet provider (this should open the modal)
          try {
            console.log('Calling eth_sendTransaction - this should open the Farcaster wallet modal...');
            console.log('Transaction params:', JSON.stringify(txParams, null, 2));
            
            // The eth_sendTransaction call should automatically open the Farcaster wallet modal
            hash = await ethereumProvider.request({
              method: 'eth_sendTransaction',
              params: [txParams],
            }) as string;
            
            if (!hash || hash === 'null' || hash === 'undefined') {
              throw new Error('Transaction hash not received. The transaction may have been rejected or failed.');
            }
            
            console.log('Transaction sent successfully, hash:', hash);
            setTxHash(hash);
            
            // Wait for confirmation
            if (publicClient) {
              console.log('Waiting for transaction confirmation...');
              await publicClient.waitForTransactionReceipt({ hash: hash as `0x${string}` });
              console.log('Transaction confirmed!');
            }
          } catch (farcasterErr: any) {
            console.error('Farcaster provider transaction error:', farcasterErr);
            const errorMsg = farcasterErr?.message || farcasterErr?.error?.message || String(farcasterErr);
            const errorCode = farcasterErr?.code || farcasterErr?.error?.code;
            console.error('Error code:', errorCode);
            console.error('Full error:', JSON.stringify(farcasterErr, null, 2));
            
            // Check if it's a user rejection
            if (errorMsg.includes('rejected') || errorMsg.includes('denied') || errorMsg.includes('User rejected') || errorCode === 4001 || errorCode === 'ACTION_REJECTED') {
              throw new Error('Transaction was rejected. Please try again when you\'re ready to confirm.');
            }
            
            // Check for execution reverted (transaction would fail)
            if (errorMsg.includes('execution reverted') || errorMsg.includes('revert') || errorMsg.includes('Transaction failure')) {
              throw new Error('Transaction would fail. The recipient address may not accept direct ETH transfers. Please verify the liquidity pool address is correct and can receive ETH.');
            }
            
            // Check if modal didn't open (provider error)
            if (errorMsg.includes('provider') || errorMsg.includes('not available') || errorMsg.includes('not found')) {
              throw new Error('Farcaster wallet is not available. Please make sure you are using the Farcaster app and your wallet is connected.');
            }
            
            throw new Error(`Transaction failed: ${errorMsg}. Please check the browser console for more details.`);
          }
        } else if (client) {
          console.log('Using wagmi wallet client for transaction');
          // Fallback to regular wallet client
          hash = await client.sendTransaction({
            to: data.transaction.to as `0x${string}`,
            value: data.transaction.value,
            account: walletAddress as `0x${string}`,
          });
          console.log('Transaction sent via wagmi, hash:', hash);
          setTxHash(hash);
          if (publicClient) {
            await publicClient.waitForTransactionReceipt({ hash: hash as `0x${string}` });
          }
        } else {
          throw new Error("No wallet provider available. Please make sure your wallet is connected.");
        }
      } catch (txErr: any) {
        console.error('Transaction error:', txErr);
        
        // Check for insufficient balance errors
        const errorMessage = txErr?.message || txErr?.error?.message || String(txErr);
        const isInsufficientBalance = 
          errorMessage.includes('insufficient funds') ||
          errorMessage.includes('insufficient balance') ||
          errorMessage.includes('Insufficient gas') ||
          errorMessage.includes('not enough funds') ||
          errorMessage.includes('exceeds balance') ||
          txErr?.code === 'INSUFFICIENT_FUNDS' ||
          txErr?.code === -32000;
        
        if (isInsufficientBalance) {
          throw new Error(`Insufficient balance. You need at least 0.001 ETH + gas fees (approximately 0.0001 ETH) in your wallet to mint. Your current balance is too low. Please fund your wallet and try again.`);
        }
        
        // Check if user rejected the transaction
        const isRejected = 
          errorMessage.includes('User rejected') ||
          errorMessage.includes('user rejected') ||
          errorMessage.includes('rejected') ||
          txErr?.code === 4001 ||
          txErr?.code === 'ACTION_REJECTED';
        
        if (isRejected) {
          throw new Error('Transaction was rejected. Please try again when you\'re ready to confirm.');
        }
        
        // Fallback to regular wallet client if Farcaster provider fails
        if (client && hash === undefined) {
          console.log('Trying fallback with wagmi client');
          try {
            hash = await client.sendTransaction({
              to: data.transaction.to as `0x${string}`,
              value: data.transaction.value,
              account: walletAddress as `0x${string}`,
            });
            console.log('Fallback transaction sent, hash:', hash);
            setTxHash(hash);
            if (publicClient) {
              await publicClient.waitForTransactionReceipt({ hash: hash as `0x${string}` });
            }
          } catch (fallbackErr: any) {
            console.error('Fallback transaction also failed:', fallbackErr);
            const fallbackMsg = fallbackErr?.message || fallbackErr?.error?.message || 'Unknown error';
            const isFallbackInsufficient = 
              fallbackMsg.includes('insufficient funds') ||
              fallbackMsg.includes('insufficient balance') ||
              fallbackMsg.includes('Insufficient gas') ||
              fallbackMsg.includes('not enough funds');
            
            if (isFallbackInsufficient) {
              throw new Error(`Insufficient balance. You need at least 0.001 ETH + gas fees (approximately 0.0001 ETH) in your wallet to mint. Please fund your wallet and try again.`);
            }
            throw new Error(`Transaction failed: ${fallbackMsg}`);
          }
      } else {
          throw new Error(`Transaction failed: ${errorMessage}. Please make sure your wallet is connected to Base network and has enough ETH (0.001 ETH + gas fees).`);
        }
      }

      if (!hash) {
        throw new Error("Transaction hash not received. Transaction may have failed.");
      }

      // Record mint in database with cast data (don't fail if this fails)
      try {
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
        console.log('Mint recorded in database');
      } catch (dbErr) {
        console.error('Failed to record mint in database (non-critical):', dbErr);
        // Don't fail the whole process if database recording fails
      }

      setStep("success");
    } catch (err) {
      console.error('Error minting NFT:', err);
      const errorMessage = err instanceof Error ? err.message : (typeof err === 'string' ? err : 'Minting failed');
      setError(errorMessage);
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
                  <div className="text-lg sm:text-xl md:text-2xl font-black">0.001 ETH</div>
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
                  Mint a $tabledadrian NFT generated from your Farcaster profile picture. All fees (0.001 ETH) go to the LP of the token.
            </p>
          </div>


              {/* Main Mint Button - Auto-fetches user data */}
              {isConnected && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!loading) {
                      mintNFT();
                    }
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!loading) {
                      mintNFT();
                    }
                  }}
                  disabled={loading}
                  className="w-full bg-black text-white border-4 border-black p-4 sm:p-6 text-lg sm:text-xl font-black
                           hover:bg-white hover:text-black transition-all duration-200
                           active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                           disabled:opacity-50 disabled:cursor-not-allowed
                           touch-manipulation cursor-pointer text-center
                           active:scale-95"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  {loading ? 'LOADING...' : 'MINT NFT (0.001 ETH)'}
                </button>
              )}
            </>
          )}

          {/* Step: Fetching User Data */}
          {step === "fetch" && (
            <div className="text-center py-6 sm:py-8">
              <div className="text-xl sm:text-2xl font-black mb-4">FETCHING YOUR PROFILE...</div>
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
            </div>
          )}

          {/* Step: Generating NFT with Progress Bar */}
          {step === "generate" && (
            <div className="text-center py-6 sm:py-8">
              <div className="text-xl sm:text-2xl font-black mb-4">GENERATING YOUR NFT...</div>
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
              
              {/* Progress Bar */}
              <div className="border-2 border-black p-4 sm:p-6 mb-4 bg-gray-50">
                <div className="text-sm sm:text-base font-bold mb-3 text-gray-800">
                  {currentPhrase || "Starting generation..."}
                </div>
                
                {/* Progress Bar Container */}
                <div className="w-full bg-gray-200 border-2 border-black h-6 sm:h-8 mb-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 transition-all duration-500 ease-out"
                    style={{ width: `${generationProgress}%` }}
                  >
                    <div className="h-full bg-black opacity-20 animate-pulse"></div>
                  </div>
                </div>
                
                {/* Progress Percentage */}
                <div className="text-xs sm:text-sm font-bold text-gray-600">
                  {Math.round(generationProgress)}%
                </div>
              </div>
              
              <div className="text-xs sm:text-sm text-gray-600 px-4">
                Using AI to transform your PFP into a Table d'Adrian member in a DeSci universe...
              </div>
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
                <div className="text-xs sm:text-sm font-bold">Price: 0.001 ETH → Liquidity Pool</div>
              </div>

              {/* Mint Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!loading && isConnected) {
                    mintNFT();
                  }
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!loading && isConnected) {
                    mintNFT();
                  }
                }}
                disabled={loading || !isConnected}
                className="w-full bg-black text-white border-4 border-black p-4 sm:p-6 text-lg sm:text-xl font-black
                         hover:bg-white hover:text-black transition-all duration-200
                         active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                         disabled:opacity-50 disabled:cursor-not-allowed
                         touch-manipulation cursor-pointer
                         active:scale-95"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {loading ? 'PREPARING MINT...' : 'MINT NFT (0.001 ETH)'}
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
                <div className="text-xs mb-2">NFT minted and owned by you • 0.001 ETH sent to $TA Liquidity Pool</div>
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
            <div className="text-xs sm:text-sm mt-1">Powered by Base Network • AI Generated with Replicate (Image-to-Image)</div>
          </div>
        </div>

      </div>
    </div>
  );
}