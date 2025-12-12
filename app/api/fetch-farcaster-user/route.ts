import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');
  const wallet = searchParams.get('wallet');
  const fid = searchParams.get('fid');

  console.log('API called with:', { username, wallet, fid });

  if (!username && !wallet && !fid) {
    return NextResponse.json({ error: 'Username, wallet, or FID required' }, { status: 400 });
  }

  try {
    let targetFid: number | null = null;

    // If FID is provided directly, use it
    if (fid) {
      targetFid = parseInt(fid);
      console.log('Using provided FID:', targetFid);
      if (isNaN(targetFid) || targetFid <= 0) {
        return NextResponse.json({
          error: 'Invalid FID provided',
          details: `FID must be a positive number, got: ${fid}`
        }, { status: 400 });
      }
    }

    // Try multiple endpoints for better reliability

    // Method 1: Direct username lookup using Farcaster Hub
    if (!targetFid && username) {
      const cleanUsername = username.replace('@', '').toLowerCase();
      console.log('Trying direct username lookup for:', cleanUsername);

      try {
        // Try the official Farcaster Hub API
        const hubRes = await fetch(`https://api.farcaster.xyz/v2/user-by-username?username=${cleanUsername}`, {
          headers: { 'Accept': 'application/json' }
        });
        if (hubRes.ok) {
          const hubData = await hubRes.json();
          if (hubData.result?.user) {
            targetFid = hubData.result.user.fid;
            console.log('Found FID via Hub API:', targetFid);
          } else if (hubData.user) {
            targetFid = hubData.user.fid;
            console.log('Found FID via Hub API (alt format):', targetFid);
          }
        } else {
          console.log('Hub API failed with status:', hubRes.status);
        }
      } catch (err) {
        console.log('Hub API error:', err);
      }

      // Fallback: Try Neynar API
      if (!targetFid) {
        try {
          const neynarRes = await fetch(`https://api.neynar.com/v2/farcaster/user/by_username?username=${cleanUsername}`, {
            headers: { 
              'Accept': 'application/json',
              'api_key': process.env.NEYNAR_API_KEY || ''
            }
          });
          if (neynarRes.ok) {
            const neynarData = await neynarRes.json();
            targetFid = neynarData.result?.fid || null;
            console.log('Found FID via Neynar:', targetFid);
          }
        } catch (err) {
          console.log('Neynar lookup error:', err);
        }
      }

      // Fallback: Try Fname registry
      if (!targetFid) {
        try {
          const fnameRes = await fetch(`https://fnames.farcaster.xyz/transfers/current?name=${cleanUsername}`, {
            headers: { 'Accept': 'application/json' }
          });
          if (fnameRes.ok) {
            const fnameData = await fnameRes.json();
            targetFid = fnameData.transfers?.[0]?.to || null;
            console.log('Found FID via Fname registry:', targetFid);
          }
        } catch (err) {
          console.log('Fname registry error:', err);
        }
      }
    }

    // Method 2: Wallet lookup
    if (!targetFid && wallet) {
      console.log('Trying wallet lookup for:', wallet);
      
      // Normalize wallet address (lowercase, remove 0x prefix issues)
      const normalizedWallet = wallet.toLowerCase().startsWith('0x') ? wallet.toLowerCase() : `0x${wallet.toLowerCase()}`;
      
      try {
        // Try Pinata Hub (most reliable)
        const pinataRes = await fetch(`https://hub.pinata.cloud/v1/verificationsByAddress?address=${normalizedWallet}`, {
          headers: { 'Accept': 'application/json' }
        });
        if (pinataRes.ok) {
          const pinataData = await pinataRes.json();
          targetFid = pinataData.messages?.[0]?.data?.fid || null;
          console.log('Found FID via Pinata:', targetFid);
        } else {
          console.log('Pinata lookup failed with status:', pinataRes.status);
        }
      } catch (err) {
        console.log('Pinata lookup error:', err);
      }
      
      // Fallback: Try direct Hub API with correct format
      if (!targetFid) {
        try {
          // Try Farcaster Hub API v2 - correct endpoint
          const hubWalletRes = await fetch(`https://api.farcaster.xyz/v2/verifications?address=${normalizedWallet}`, {
            headers: { 
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
          
          if (hubWalletRes.ok) {
            const hubWalletData = await hubWalletRes.json();
            // Check different response formats
            targetFid = hubWalletData.result?.verifications?.[0]?.fid || 
                       hubWalletData.verifications?.[0]?.fid ||
                       hubWalletData.result?.fid ||
                       null;
            console.log('Found FID via Hub wallet API:', targetFid);
          } else {
            const errorText = await hubWalletRes.text().catch(() => '');
            console.log('Hub wallet API failed with status:', hubWalletRes.status, errorText);
            
            // Try alternative: user-by-verification endpoint
            const altRes = await fetch(`https://api.farcaster.xyz/v2/user-by-verification?address=${normalizedWallet}`, {
              headers: { 
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              }
            });
            if (altRes.ok) {
              const altData = await altRes.json();
              targetFid = altData.result?.user?.fid || altData.user?.fid || null;
              console.log('Found FID via Hub alt API:', targetFid);
            }
          }
        } catch (err) {
          console.log('Hub wallet API error:', err);
        }
      }
      
      // Additional fallback: Try Neynar API
      if (!targetFid) {
        try {
          const neynarRes = await fetch(`https://api.neynar.com/v2/farcaster/user/by_verification?address=${normalizedWallet}`, {
            headers: { 
              'Accept': 'application/json',
              'api_key': process.env.NEYNAR_API_KEY || ''
            }
          });
          if (neynarRes.ok) {
            const neynarData = await neynarRes.json();
            targetFid = neynarData.result?.fid || null;
            console.log('Found FID via Neynar:', targetFid);
          }
        } catch (err) {
          console.log('Neynar lookup error:', err);
        }
      }
    }

    if (!targetFid) {
      console.error('No FID found after trying all methods:', { username, wallet, fid });
      console.error('Tried: Hub API, Neynar API, Fname registry, Pinata, wallet verifications');
      return NextResponse.json({
        error: 'User not found. Please check your username or ensure your wallet is connected to Farcaster.',
        details: 'Try your exact Farcaster username (without @) or make sure your wallet is verified on Warpcast.',
        debug: {
          triedUsername: username,
          triedWallet: wallet,
          triedFid: fid
        }
      }, { status: 404 });
    }

    // Get user data - try multiple sources
    let userData: { user?: { username?: string; display_name?: string; pfp_url?: string; bio?: string } } | null = null;

    // Get wallet address from verifications
    let walletAddress = wallet || null;
    try {
      const verificationsRes = await fetch(`https://api.farcaster.xyz/v2/verifications?fid=${targetFid}`);
      if (verificationsRes.ok) {
        const verificationsData = await verificationsRes.json();
        walletAddress = verificationsData.result?.verifications?.[0]?.address || walletAddress;
        console.log('Got wallet address:', walletAddress);
      }
    } catch (err) {
      console.log('Could not get verifications');
    }

    // Try multiple sources for user data in parallel
    const userDataPromises = [
      // 1. Official Farcaster API
      fetch(`https://api.farcaster.xyz/v2/user?fid=${targetFid}`, {
        headers: { 'Accept': 'application/json' }
      })
        .then(async res => {
          if (res.ok) {
            const data = await res.json();
            if (data.result?.user) {
              return { user: data.result.user };
            } else if (data.user) {
              return { user: data.user };
            }
          }
          return null;
        })
        .catch(() => null),
      
      // 2. Pinata Hub
      fetch(`https://hub.pinata.cloud/v1/userDataByFid?fid=${targetFid}`)
        .then(async res => {
          if (res.ok) {
            const pinataData = await res.json();
            const userDataFromPinata: any = { user: {} };
            const messages = pinataData.messages || [];
            messages.forEach((msg: any) => {
              const type = msg.data?.userDataBody?.type;
              const value = msg.data?.userDataBody?.value;

              if (type === 'USER_DATA_TYPE_USERNAME') {
                userDataFromPinata.user.username = value;
              } else if (type === 'USER_DATA_TYPE_DISPLAY') {
                userDataFromPinata.user.display_name = value;
              } else if (type === 'USER_DATA_TYPE_PFP') {
                userDataFromPinata.user.pfp_url = value;
              } else if (type === 'USER_DATA_TYPE_BIO') {
                userDataFromPinata.user.bio = value;
              }
            });
            return userDataFromPinata;
          }
          return null;
        })
        .catch(() => null),
      
      // 3. Try Warpcast API
      fetch(`https://api.warpcast.com/v2/user-by-fid?fid=${targetFid}`, {
        headers: { 'Accept': 'application/json' }
      })
        .then(async res => {
          if (res.ok) {
            const data = await res.json();
            if (data.result?.user) {
              return { user: data.result.user };
            } else if (data.user) {
              return { user: data.user };
            }
          }
          return null;
        })
        .catch(() => null)
    ];

    const userDataResults = await Promise.all(userDataPromises);
    
    // Merge all results, prioritizing official API
    for (const result of userDataResults) {
      if (result?.user) {
        if (!userData) {
          userData = { user: {} };
        }
        // Merge data, keeping existing values if new ones are missing
        const existingUser = userData.user || {};
        userData.user = {
          username: existingUser.username || result.user.username,
          display_name: existingUser.display_name || result.user.display_name,
          pfp_url: existingUser.pfp_url || result.user.pfp_url,
          bio: existingUser.bio || result.user.bio,
          ...result.user // Overwrite with result data (prioritize later sources)
        };
      }
    }
    
    console.log('Final userData:', userData);

    if (!userData || !userData.user) {
      return NextResponse.json({
        error: 'Could not fetch user profile data',
        fid: fid
      }, { status: 500 });
    }

    // Ensure we have a PFP - try to get it from multiple sources if missing
    let pfpUrl = userData.user.pfp_url;
    if (!pfpUrl) {
      // Try to get PFP from verifications endpoint
      try {
        const verifRes = await fetch(`https://api.farcaster.xyz/v2/user?fid=${targetFid}`);
        if (verifRes.ok) {
          const verifData = await verifRes.json();
          pfpUrl = verifData.result?.user?.pfp_url || verifData.user?.pfp_url || null;
        }
      } catch (err) {
        console.log('Could not get PFP from verifications');
      }
    }

    const result = {
      fid: targetFid,
      username: userData.user.username || username || 'Unknown',
      display_name: userData.user.display_name || userData.user.username || null,
      pfp_url: pfpUrl || null,
      bio: userData.user.bio || null,
      wallet_address: walletAddress,
      method: fid ? 'fid' : (username ? 'username' : 'wallet')
    };
    
    console.log('Returning result with PFP:', result.pfp_url ? 'YES' : 'NO');

    console.log('Returning:', result);
    return NextResponse.json(result);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}