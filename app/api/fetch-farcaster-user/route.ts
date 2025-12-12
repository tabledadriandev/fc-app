import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, farcasterUsername } = await req.json();

    if (!farcasterUsername && !walletAddress) {
      return NextResponse.json(
        { error: "Either Farcaster username or wallet address required" },
        { status: 400 }
      );
    }

    let fid = null;
    let username = farcasterUsername;

    // If we have a username, we need to find the FID first
    if (farcasterUsername) {
      try {
        // Search for user by username to get FID
        const searchResponse = await fetch(
          `https://hub.pinata.cloud/v1/userDataByUsername?username=${encodeURIComponent(farcasterUsername)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          fid = searchData.fid;
          console.log(`✓ Found FID ${fid} for username: ${farcasterUsername}`);
        } else {
          throw new Error(`User not found: ${farcasterUsername}`);
        }
      } catch (err) {
        console.error('Username search error:', err);
        return NextResponse.json(
          {
            error: "User not found on Farcaster",
            steps: [
              "1. Go to https://warpcast.com",
              "2. Sign in to your Farcaster account",
              "3. Verify your username is correct",
              "4. Make sure your profile is public",
              "5. Try again with the exact username",
            ],
            hint: "Use your exact Farcaster username (without @)",
            alternative: "You can also try connecting your wallet first",
          },
          { status: 404 }
        );
      }
    }

    // If we have a wallet address, we need to find the associated FID
    if (walletAddress && !fid) {
      try {
        // Search for custody address to get FID
        const custodyResponse = await fetch(
          `https://hub.pinata.cloud/v1/verificationsByAddress?address=${walletAddress}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (custodyResponse.ok) {
          const custodyData = await custodyResponse.json();
          fid = custodyData.fid;
          console.log(`✓ Found FID ${fid} for wallet: ${walletAddress}`);
        } else {
          throw new Error(`No Farcaster account found for this wallet`);
        }
      } catch (err) {
        console.error('Wallet search error:', err);
        return NextResponse.json(
          {
            error: "No Farcaster account found for this wallet",
            steps: [
              "1. Go to https://warpcast.com",
              "2. Sign In (top right)",
              "3. Connect your wallet (same wallet you're using here)",
              "4. Complete email verification",
              "5. Go to Settings → Verified Addresses",
              "6. Click 'Verify an Address'",
              "7. Sign the message in your wallet",
              "8. Come back and try again",
            ],
            hint: "Your wallet must be verified on Warpcast first",
            alternative: "Try entering your username instead of using wallet",
          },
          { status: 404 }
        );
      }
    }

    if (!fid) {
      return NextResponse.json(
        { error: "Could not find FID for provided information" },
        { status: 404 }
      );
    }

    // Get user data by FID
    try {
      const response = await fetch(
        `https://hub.pinata.cloud/v1/userDataByFid?fid=${fid}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      
      // Extract profile data from messages
      const pfpMessage = data.messages?.find(
        (msg: any) => msg.data?.userDataBody?.type === 'USER_DATA_TYPE_PFP'
      );
      
      const usernameMessage = data.messages?.find(
        (msg: any) => msg.data?.userDataBody?.type === 'USER_DATA_TYPE_USERNAME'
      );

      const displayNameMessage = data.messages?.find(
        (msg: any) => msg.data?.userDataBody?.type === 'USER_DATA_TYPE_DISPLAY'
      );

      const bioMessage = data.messages?.find(
        (msg: any) => msg.data?.userDataBody?.type === 'USER_DATA_TYPE_BIO'
      );

      // Get casts
      let casts = [];
      try {
        const castsResponse = await fetch(
          `https://hub.pinata.cloud/v1/castsByFid?fid=${fid}&limit=10`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (castsResponse.ok) {
          const castsData = await castsResponse.json();
          casts = (castsData.messages || []).map((cast: any) => ({
            hash: cast.hash,
            text: cast.data?.castAddBody?.text || '',
            timestamp: cast.createdAt,
            likeCount: 0, // Would need additional API call for reactions
            replyCount: 0, // Would need additional API call for replies
          }));
          console.log(`✓ Found ${casts.length} casts`);
        }
      } catch (err) {
        console.log("Casts fetch error (optional):", (err as Error).message);
      }

      return NextResponse.json({
        success: true,
        user: {
          fid: fid,
          username: usernameMessage?.data?.userDataBody?.value || username || 'Unknown',
          displayName: displayNameMessage?.data?.userDataBody?.value || username || 'Unknown',
          pfpUrl: pfpMessage?.data?.userDataBody?.value || '',
          bio: bioMessage?.data?.userDataBody?.value || '',
          followerCount: 0, // Would need additional API call
          followingCount: 0, // Would need additional API call
        },
        casts: casts,
        method: farcasterUsername ? "username" : "wallet",
      });
    } catch (err) {
      console.error('Error fetching Farcaster user data:', err);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Fatal error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: (error as Error).message },
      { status: 500 }
    );
  }
}