import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { walletAddress } = await req.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address required" },
        { status: 400 }
      );
    }

    console.log("Fetching user for wallet:", walletAddress);

    // Step 1: Get Farcaster user from wallet address using correct Neynar endpoint
    const neynarResponse = await fetch(
      `https://api.neynar.com/v2/farcaster/user/custody-address/${walletAddress}`,
      {
        headers: {
          "X-API-KEY": process.env.NEYNAR_API_KEY || "",
        },
      }
    );

    console.log("Neynar response status:", neynarResponse.status);

    if (!neynarResponse.ok) {
      const errorText = await neynarResponse.text();
      console.error("Neynar API error:", errorText);
      
      return NextResponse.json(
        {
          error: "User not found on Farcaster. Make sure your wallet is verified on Warpcast first.",
          details: "Visit https://warpcast.com, sign in, connect wallet, go to Settings → Verified Addresses, and verify your address."
        },
        { status: 404 }
      );
    }

    const userData = await neynarResponse.json();
    console.log("User data received:", userData);
    
    const user = userData.user;

    if (!user) {
      return NextResponse.json(
        {
          error: "User data not found",
          details: "Your wallet might not be connected to a Farcaster account. Verify your wallet on Warpcast first."
        },
        { status: 404 }
      );
    }

    // Step 2: Get user's recent casts
    let casts = [];
    try {
      const castsResponse = await fetch(
        `https://api.neynar.com/v2/farcaster/feed/user/casts?fid=${user.fid}&limit=10`,
        {
          headers: {
            "X-API-KEY": process.env.NEYNAR_API_KEY || "",
          },
        }
      );

      if (castsResponse.ok) {
        const castsData = await castsResponse.json();
        casts = castsData.casts || [];
        console.log("Casts fetched:", casts.length);
      }
    } catch (castError) {
      console.error("Error fetching casts:", castError);
      // Continue without casts - not critical
    }

    return NextResponse.json({
      success: true,
      user: {
        username: user.username,
        displayName: user.display_name,
        pfpUrl: user.pfp_url,
        bio: user.profile?.bio || "",
        followerCount: user.follower_count,
        followingCount: user.following_count,
      },
      casts: casts.map((cast: any) => ({
        hash: cast.hash,
        text: cast.text,
        timestamp: cast.timestamp,
        likeCount: cast.reactions?.likes_count || 0,
        replyCount: cast.replies?.count || 0,
      })),
    });
  } catch (error) {
    console.error("Farcaster fetch error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch user data",
        details: "Check that your wallet is verified on Warpcast and you have a valid Neynar API key."
      },
      { status: 500 }
    );
  }
}