import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');
  const wallet = searchParams.get('wallet');

  console.log('API called with:', { username, wallet });

  if (!username && !wallet) {
    return NextResponse.json({ error: 'Username or wallet required' }, { status: 400 });
  }

  try {
    let fid: number | null = null;

    // Try multiple endpoints for better reliability

    // Method 1: Direct username lookup using Farcaster Hub
    if (username) {
      const cleanUsername = username.replace('@', '');
      console.log('Trying direct username lookup for:', cleanUsername);

      try {
        // Try the official Farcaster Hub API
        const hubRes = await fetch(`https://api.farcaster.xyz/v2/user-by-username?username=${cleanUsername}`);
        if (hubRes.ok) {
          const hubData = await hubRes.json();
          if (hubData.user) {
            fid = hubData.user.fid;
            console.log('Found FID via Hub API:', fid);
          }
        }
      } catch (err) {
        console.log('Hub API failed, trying alternatives');
      }

      // Fallback: Try Fname registry
      if (!fid) {
        try {
          const fnameRes = await fetch(`https://fnames.farcaster.xyz/transfers/current?name=${cleanUsername}`);
          if (fnameRes.ok) {
            const fnameData = await fnameRes.json();
            fid = fnameData.transfers?.[0]?.to || null;
            console.log('Found FID via Fname registry:', fid);
          }
        } catch (err) {
          console.log('Fname registry failed');
        }
      }
    }

    // Method 2: Wallet lookup
    if (!fid && wallet) {
      console.log('Trying wallet lookup for:', wallet);

      try {
        // Try Pinata Hub (most reliable)
        const pinataRes = await fetch(`https://hub.pinata.cloud/v1/verificationsByAddress?address=${wallet}`);
        if (pinataRes.ok) {
          const pinataData = await pinataRes.json();
          fid = pinataData.messages?.[0]?.data?.fid || null;
          console.log('Found FID via Pinata:', fid);
        }
      } catch (err) {
        console.log('Pinata lookup failed');
      }

      // Fallback: Try direct Hub API
      if (!fid) {
        try {
          const hubWalletRes = await fetch(`https://api.farcaster.xyz/v2/verifications?address=${wallet}`);
          if (hubWalletRes.ok) {
            const hubWalletData = await hubWalletRes.json();
            fid = hubWalletData.verifications?.[0]?.fid || null;
            console.log('Found FID via Hub wallet API:', fid);
          }
        } catch (err) {
          console.log('Hub wallet API failed');
        }
      }
    }

    if (!fid) {
      console.log('No FID found for:', { username, wallet });
      return NextResponse.json({
        error: 'User not found. Please check your username or ensure your wallet is connected to Farcaster.',
        details: 'Try your exact Farcaster username (without @) or make sure your wallet is verified on Warpcast.'
      }, { status: 404 });
    }

    // Get user data - try multiple sources
    let userData: { user?: { username?: string; display_name?: string; pfp_url?: string; bio?: string } } | null = null;

    try {
      // Try official Farcaster API first
      const userRes = await fetch(`https://api.farcaster.xyz/v2/user?fid=${fid}`);
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
        const pinataUserRes = await fetch(`https://hub.pinata.cloud/v1/userDataByFid?fid=${fid}`);
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
      fid,
      username: userData.user.username || username || 'Unknown',
      display_name: userData.user.display_name || userData.user.username || null,
      pfp_url: userData.user.pfp_url || null,
      bio: userData.user.bio || null,
      method: username ? 'username' : 'wallet'
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