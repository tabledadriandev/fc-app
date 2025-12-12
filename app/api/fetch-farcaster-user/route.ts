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
    }

    // Try multiple endpoints for better reliability

    // Method 1: Direct username lookup using Farcaster Hub
    if (!targetFid && username) {
      const cleanUsername = username.replace('@', '');
      console.log('Trying direct username lookup for:', cleanUsername);

      try {
        // Try the official Farcaster Hub API
        const hubRes = await fetch(`https://api.farcaster.xyz/v2/user-by-username?username=${cleanUsername}`);
        if (hubRes.ok) {
          const hubData = await hubRes.json();
          if (hubData.user) {
            targetFid = hubData.user.fid;
            console.log('Found FID via Hub API:', targetFid);
          }
        }
      } catch (err) {
        console.log('Hub API failed, trying alternatives');
      }

      // Fallback: Try Fname registry
      if (!targetFid) {
        try {
          const fnameRes = await fetch(`https://fnames.farcaster.xyz/transfers/current?name=${cleanUsername}`);
          if (fnameRes.ok) {
            const fnameData = await fnameRes.json();
            targetFid = fnameData.transfers?.[0]?.to || null;
            console.log('Found FID via Fname registry:', targetFid);
          }
        } catch (err) {
          console.log('Fname registry failed');
        }
      }
    }

    // Method 2: Wallet lookup
    if (!targetFid && wallet) {
      console.log('Trying wallet lookup for:', wallet);

      try {
        // Try Pinata Hub (most reliable)
        const pinataRes = await fetch(`https://hub.pinata.cloud/v1/verificationsByAddress?address=${wallet}`);
        if (pinataRes.ok) {
          const pinataData = await pinataRes.json();
          targetFid = pinataData.messages?.[0]?.data?.fid || null;
          console.log('Found FID via Pinata:', targetFid);
        }
      } catch (err) {
        console.log('Pinata lookup failed');
      }

      // Fallback: Try direct Hub API
      if (!targetFid) {
        try {
          const hubWalletRes = await fetch(`https://api.farcaster.xyz/v2/verifications?address=${wallet}`);
          if (hubWalletRes.ok) {
            const hubWalletData = await hubWalletRes.json();
            targetFid = hubWalletData.result?.verifications?.[0]?.fid || null;
            console.log('Found FID via Hub wallet API:', targetFid);
          }
        } catch (err) {
          console.log('Hub wallet API failed');
        }
      }
    }

    if (!targetFid) {
      console.log('No FID found for:', { username, wallet, fid });
      return NextResponse.json({
        error: 'User not found. Please check your username or ensure your wallet is connected to Farcaster.',
        details: 'Try your exact Farcaster username (without @) or make sure your wallet is verified on Warpcast.'
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

    try {
      // Try official Farcaster API first
      const userRes = await fetch(`https://api.farcaster.xyz/v2/user?fid=${targetFid}`);
      if (userRes.ok) {
        userData = await userRes.json();
        console.log('Got user data from official API');
      }
    } catch (err) {
      console.log('Official API failed, trying Pinata');
    }

    // Fallback to Pinata
    if (!userData) {
      try {
        const pinataUserRes = await fetch(`https://hub.pinata.cloud/v1/userDataByFid?fid=${targetFid}`);
        if (pinataUserRes.ok) {
          const pinataData = await pinataUserRes.json();
          userData = { user: {} };

          // Extract data from messages
          const messages = pinataData.messages || [];
          messages.forEach((msg: any) => {
            const type = msg.data?.userDataBody?.type;
            const value = msg.data?.userDataBody?.value;

            if (type === 'USER_DATA_TYPE_USERNAME') {
              userData!.user!.username = value;
            } else if (type === 'USER_DATA_TYPE_DISPLAY') {
              userData!.user!.display_name = value;
            } else if (type === 'USER_DATA_TYPE_PFP') {
              userData!.user!.pfp_url = value;
            } else if (type === 'USER_DATA_TYPE_BIO') {
              userData!.user!.bio = value;
            }
          });
          console.log('Got user data from Pinata');
        }
      } catch (err) {
        console.log('Pinata user data failed');
      }
    }

    if (!userData?.user) {
      return NextResponse.json({
        error: 'Could not fetch user profile data',
        fid: fid
      }, { status: 500 });
    }

    const result = {
      fid: targetFid,
      username: userData.user.username || username || 'Unknown',
      display_name: userData.user.display_name || userData.user.username || null,
      pfp_url: userData.user.pfp_url || null,
      bio: userData.user.bio || null,
      wallet_address: walletAddress,
      method: fid ? 'fid' : (username ? 'username' : 'wallet')
    };

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