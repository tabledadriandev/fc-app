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

    // Step 1: Get Farcaster user from wallet address
    // Using Neynar API (free tier available)
    const neynarResponse = await fetch(
      `https://api.neynar.com/v2/farcaster/user/by_verification?address=${walletAddress}`,
      {
        headers: {
          "X-API-KEY": process.env.NEYNAR_API_KEY || "", // Get free key from neynar.com
        },
      }
    );

    if (!neynarResponse.ok) {
      return NextResponse.json(
        { error: "User not found on Farcaster" },
        { status: 404 }
      );
    }

    const userData = await neynarResponse.json();
    const user = userData.user;

    if (!user) {
      return NextResponse.json(
        { error: "User data not found" },
        { status: 404 }
      );
    }

    // Step 2: Get user's recent casts
    const castsResponse = await fetch(
      `https://api.neynar.com/v2/farcaster/feed/user/casts?fid=${user.fid}&limit=10`,
      {
        headers: {
          "X-API-KEY": process.env.NEYNAR_API_KEY || "",
        },
      }
    );

    let casts = [];
    if (castsResponse.ok) {
      const castsData = await castsResponse.json();
      casts = castsData.casts || [];
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
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }
}