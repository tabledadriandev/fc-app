import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !key) {
    throw new Error('Supabase URL or key missing in environment')
  }
  
  return createClient(url, key)
}

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, username, nftImageUrl, txHash, taBalance, castText, castHash, castTimestamp, pfpUrl } =
      await req.json();

    // Try to save to database, but don't fail if Supabase is down
    try {
      const supabase = getSupabaseClient()

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