import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Force dynamic rendering to avoid build-time Supabase connection attempts
export const dynamic = 'force-dynamic';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !key) {
    return null; // Return null instead of throwing
  }
  
  try {
    return createClient(url, key)
  } catch (error) {
    console.warn('Failed to create Supabase client:', error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, username, nftImageUrl, txHash, taBalance, castText, castHash, castTimestamp, pfpUrl } =
      await req.json();

    // Try to save to database, but don't fail if Supabase is down
    try {
      const supabase = getSupabaseClient()
      
      if (!supabase) {
        console.warn("Supabase client not available (mint still successful)");
      } else {
        const { error } = await supabase.from("ta_nft_mints").insert([
          {
            wallet_address: walletAddress,
            username,
            nft_image_url: nftImageUrl,
            tx_hash: txHash,
            ta_balance_at_mint: taBalance,
            cast_text: castText || null,
            cast_hash: castHash || null,
            cast_timestamp: castTimestamp || null,
            pfp_url: pfpUrl || null,
            minted_at: new Date().toISOString(),
          },
        ]);

        if (error) {
          console.warn("Database save failed (continuing anyway):", error);
        }
      }
    } catch (dbError) {
      // Supabase is down or misconfigured - that's OK, mint still succeeded
      console.warn("Supabase connection failed (mint still successful):", dbError);
    }

    // Always return success - mint worked, database is optional
    return NextResponse.json({
      success: true,
      message: "Mint recorded",
      note: "Database may be unavailable, but mint was successful",
    });
  } catch (error) {
    console.error("Record mint error:", error);
    return NextResponse.json(
      { error: "Recording failed" },
      { status: 500 }
    );
  }
}