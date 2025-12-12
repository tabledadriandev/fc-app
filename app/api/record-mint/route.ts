import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, username, nftImageUrl, txHash, taBalance } =
      await req.json();

    const { error } = await supabase.from("ta_nft_mints").insert([
      {
        wallet_address: walletAddress,
        username,
        nft_image_url: nftImageUrl,
        tx_hash: txHash,
        ta_balance_at_mint: taBalance,
        minted_at: new Date().toISOString(),
      },
    ]);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Mint recorded",
    });
  } catch (error) {
    console.error("Record mint error:", error);
    return NextResponse.json(
      { error: "Recording failed" },
      { status: 500 }
    );
  }
}