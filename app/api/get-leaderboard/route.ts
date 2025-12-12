import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    // Get all mints sorted by amount (descending)
    const { data: mints, error } = await supabase
      .from("ta_nft_mints")
      .select("*")
      .order("minted_at", { ascending: false });

    if (error) throw error;

    // Calculate leaderboard (group by username, sum mints per user)
    const leaderboard = mints.reduce(
      (acc: Record<string, any>, mint: any) => {
        const key = mint.username;
        if (!acc[key]) {
          acc[key] = {
            username: mint.username,
            wallet: mint.wallet_address,
            count: 0,
            totalEth: 0,
          };
        }
        acc[key].count += 1;
        acc[key].totalEth += 0.003; // Each mint is 0.003 ETH
        return acc;
      },
      {}
    );

    const leaderboardArray = Object.values(leaderboard)
      .sort((a: any, b: any) => b.totalEth - a.totalEth)
      .slice(0, 20); // Top 20

    return NextResponse.json({
      success: true,
      leaderboard: leaderboardArray,
      totalMints: mints.length,
      totalVolume: mints.length * 0.003,
      recentTransactions: mints.slice(0, 50),
      recentMints: mints.slice(0, 12), // NEW: Return NFT images for gallery
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}