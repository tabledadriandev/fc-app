import { NextRequest, NextResponse } from "next/server";

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;

// Alternative approach: Direct Farcaster username lookup without requiring wallet connection
export async function POST(req: NextRequest) {
  try {
    const { walletAddress, farcasterUsername } = await req.json();

    if (!farcasterUsername && !walletAddress) {
      return NextResponse.json(
        { error: "Either Farcaster username or wallet address required" },
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

    console.log("Looking up Farcaster user:", { walletAddress, farcasterUsername });

    let user = null;

    // METHOD 1: Try direct username lookup (more reliable)
    if (farcasterUsername) {
      try {
        const usernameUrl = `https://api.neynar.com/v2/farcaster/user/by_username?username=${farcasterUsername}`;
        console.log("Trying direct username lookup...");

        const response = await fetch(usernameUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": NEYNAR_API_KEY,
          },
        });

        if (response.ok) {
          const data = await response.json();
          user = data.user;
          console.log("✓ User found by username:", user?.username);
        } else {
          const errorData = await response.json();
          console.log("Username lookup status:", response.status, errorData);
        }
      } catch (err) {
        console.log("Username lookup error:", (err as Error).message);
      }
    }

    // METHOD 2: Try by FID if username didn't work
    if (!user && farcasterUsername) {
      try {
        // First get user info to get FID
        const userUrl = `https://api.neynar.com/v2/farcaster/user/by_username?username=${farcasterUsername}`;
        const userResponse = await fetch(userUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": NEYNAR_API_KEY,
          },
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          const fid = userData.user?.fid;
          
          if (fid) {
            // Get detailed user info by FID
            const fidUrl = `https://api.neynar.com/v2/farcaster/user?fid=${fid}`;
            const fidResponse = await fetch(fidUrl, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "x-api-key": NEYNAR_API_KEY,
              },
            });

            if (fidResponse.ok) {
              const fidData = await fidResponse.json();
              user = fidData.user;
              console.log("✓ User found by FID:", user?.username);
            }
          }
        }
      } catch (err) {
        console.log("FID lookup error:", (err as Error).message);
      }
    }

    // METHOD 3: Wallet address lookup (fallback)
    if (!user && walletAddress) {
      try {
        const walletUrl = `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${walletAddress}&address_types=custody_address,verified_address`;
        console.log("Trying wallet address lookup...");

        const response = await fetch(walletUrl, {
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
            console.log("✓ User found by wallet:", user?.username);
          }
        }
      } catch (err) {
        console.log("Wallet lookup error:", (err as Error).message);
      }
    }

    // If still no user found
    if (!user) {
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
          alternative: "You can also connect your wallet first, then click 'Check DNA'",
        },
        { status: 404 }
      );
    }

    // Get recent casts
    let casts = [];
    try {
      const castsUrl = `https://api.neynar.com/v2/farcaster/feed/user/casts?fid=${user.fid}&limit=10`;
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
        custodyAddress: user.custody_address,
        verifiedAddresses: user.verified_addresses || [],
      },
      casts: casts,
      method: farcasterUsername ? "username" : "wallet",
    });
  } catch (error) {
    console.error("Fatal error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: (error as Error).message },
      { status: 500 }
    );
  }
}