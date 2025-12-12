import { NextRequest, NextResponse } from "next/server";

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { walletAddress } = await req.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address required" },
        { status: 400 }
      );
    }

    if (!NEYNAR_API_KEY) {
      console.error("NEYNAR_API_KEY not configured in environment");
      return NextResponse.json(
        {
          error: "NEYNAR_API_KEY not configured",
          hint: "Check your .env.local and Vercel environment variables",
        },
        { status: 500 }
      );
    }

    console.log("Looking up Farcaster user for wallet:", walletAddress);

    let user = null;

    // METHOD 1: Try by custody address (Official Neynar endpoint)
    // https://docs.neynar.com/reference/lookup-user-by-custody-address
    try {
      const snapchainUrl = `https://snapchain-api.neynar.com/v1/farcaster/user/custody-address/${walletAddress}`;
      console.log("Trying Snapchain custody address lookup...");

      const response = await fetch(snapchainUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": NEYNAR_API_KEY,
        },
      });

      if (response.ok) {
        const data = await response.json();
        user = data.user;
        console.log("✓ User found by custody address:", user?.username);
      } else {
        const errorData = await response.json();
        console.log("Custody lookup status:", response.status, errorData);
      }
    } catch (err) {
      console.log("Custody address error:", (err as Error).message);
    }

    // METHOD 2: Try bulk address lookup (fallback)
    if (!user) {
      try {
        const bulkUrl = `https://snapchain-api.neynar.com/v1/farcaster/user/bulk-by-address?addresses=${walletAddress}&address_types=custody_address,verified_address`;
        console.log("Trying Snapchain bulk address lookup...");

        const response = await fetch(bulkUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": NEYNAR_API_KEY,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.users && data.users.length > 0) {
            user = data.users[0];
            console.log("✓ User found by bulk lookup:", user?.username);
          }
        }
      } catch (err) {
        console.log("Bulk lookup error:", (err as Error).message);
      }
    }

    // If still no user found
    if (!user) {
      return NextResponse.json(
        {
          error: "User not found on Farcaster",
          steps: [
            "1. Go to https://warpcast.com",
            "2. Click 'Sign In' (top right)",
            "3. Connect your wallet (same wallet you're using here)",
            "4. Complete email verification",
            "5. Go to Settings → Verified Addresses",
            "6. Click 'Verify an Address'",
            "7. Sign the message in your wallet",
            "8. Come back and click 'Check DNA' again",
          ],
          hint: "Your wallet must be verified on Warpcast first",
        },
        { status: 404 }
      );
    }

    // Get recent casts
    let casts = [];
    try {
      const castsUrl = `https://snapchain-api.neynar.com/v1/farcaster/feed/user/casts?fid=${user.fid}&limit=10`;
      console.log("Fetching casts...");

      const castsResponse = await fetch(castsUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": NEYNAR_API_KEY,
        },
      });

      if (castsResponse.ok) {
        const castsData = await castsResponse.json();
        casts = (castsData.casts || []).map((cast: any) => ({
          hash: cast.hash,
          text: cast.text,
          timestamp: cast.timestamp,
          likeCount: cast.reactions?.likes_count || 0,
          replyCount: cast.replies?.count || 0,
        }));
        console.log(`✓ Found ${casts.length} casts`);
      }
    } catch (err) {
      console.log("Casts fetch error (optional):", (err as Error).message);
      // Casts are optional, don't fail if error
    }

    return NextResponse.json({
      success: true,
      user: {
        fid: user.fid,
        username: user.username,
        displayName: user.display_name || user.username,
        pfpUrl: user.pfp_url || "",
        bio: user.profile?.bio || "",
        followerCount: user.follower_count || 0,
        followingCount: user.following_count || 0,
      },
      casts: casts,
    });
  } catch (error) {
    console.error("Fatal error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: (error as Error).message },
      { status: 500 }
    );
  }
}