import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error('Supabase URL or key missing in environment');
  }
  
  return createClient(url, key);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = getSupabaseClient();

    // Get all mints with cast data, ordered by most recent
    const { data: mints, error } = await supabase
      .from("ta_nft_mints")
      .select("*")
      .order("minted_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Format the data for display
    const gallery = mints?.map((mint) => ({
      id: mint.id,
      username: mint.username,
      wallet_address: mint.wallet_address,
      nft_image_url: mint.nft_image_url,
      pfp_url: mint.pfp_url,
      cast_text: mint.cast_text,
      cast_hash: mint.cast_hash,
      cast_timestamp: mint.cast_timestamp,
      tx_hash: mint.tx_hash,
      minted_at: mint.minted_at,
    })) || [];

    return NextResponse.json({
      success: true,
      gallery,
      total: gallery.length,
    });
  } catch (error) {
    console.error("Gallery error:", error);
    return NextResponse.json(
      { error: "Failed to fetch gallery" },
      { status: 500 }
    );
  }
}

