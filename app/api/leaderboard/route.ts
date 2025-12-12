import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

// Force dynamic rendering to avoid build-time Supabase connection attempts
export const dynamic = 'force-dynamic';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    return null; // Return null instead of throwing
  }
  
  try {
    return createClient(url, key);
  } catch (error) {
    console.warn('Failed to create Supabase client:', error);
    return null;
  }
}

export async function GET() {
  try {
    let allMints = null;
    
    try {
      const supabase = getSupabaseClient();
      
      if (!supabase) {
        throw new Error('Supabase client not available');
      }
      
      const { data, error: mintsError } = await supabase
        .from("ta_nft_mints")
        .select("username, wallet_address, pfp_url")
        .order("minted_at", { ascending: false });

      if (mintsError) throw mintsError;
      allMints = data;
    } catch (dbError) {
      // Database unavailable - return empty leaderboard
      console.warn("Supabase unavailable, returning empty leaderboard:", dbError);
      return NextResponse.json({
        success: true,
        leaderboard: [],
      });
    }

    // Group by wallet_address and count mints
    const mintCounts = new Map<string, {
      username: string;
      wallet_address: string;
      pfp_url: string | null;
      mint_count: number;
      total_eth: number;
    }>();

    // Count mints per wallet
    allMints?.forEach((mint) => {
      const key = mint.wallet_address;
      if (!mintCounts.has(key)) {
        mintCounts.set(key, {
          username: mint.username,
          wallet_address: mint.wallet_address,
          pfp_url: mint.pfp_url,
          mint_count: 0,
          total_eth: 0,
        });
      }
      const entry = mintCounts.get(key)!;
      entry.mint_count += 1;
      entry.total_eth += 0.001; // Each mint is 0.001 ETH
    });

    // Convert to array and sort by mint count
    const leaderboardData = Array.from(mintCounts.values())
      .sort((a, b) => b.mint_count - a.mint_count)
      .map((entry, index) => ({
        rank: index + 1,
        ...entry,
      }));

    return NextResponse.json({
      success: true,
      leaderboard: leaderboardData,
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}

