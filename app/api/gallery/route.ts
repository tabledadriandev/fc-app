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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let mints = null;
    
    try {
      const supabase = getSupabaseClient();
      
      if (!supabase) {
        throw new Error('Supabase client not available');
      }
      
      const { data, error } = await supabase
        .from("ta_nft_mints")
        .select("*")
        .order("minted_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      mints = data;
    } catch (dbError) {
      // Database unavailable - return empty gallery
      console.warn("Supabase unavailable, returning empty gallery:", dbError);
      return NextResponse.json({
        success: true,
        gallery: [],
        total: 0,
      });
    }

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

