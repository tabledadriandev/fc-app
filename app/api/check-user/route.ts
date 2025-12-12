import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    throw new Error('Supabase URL or key missing in environment')
  }
  
  return createClient(url, key)
}

const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL),
});

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, farcasterUsername, pfpUrl } = await req.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet not connected" },
        { status: 400 }
      );
    }

    // Check TA token balance
    const TA_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_TA_TOKEN_ADDRESS!;

    // Simple ERC-20 balance check (you may already have this)
    const balance = await publicClient.readContract({
      address: TA_TOKEN_ADDRESS as `0x${string}`,
      abi: [
        {
          name: "balanceOf",
          type: "function",
          inputs: [{ name: "account", type: "address" }],
          outputs: [{ name: "", type: "uint256" }],
          stateMutability: "view",
        },
      ],
      functionName: "balanceOf",
      args: [walletAddress as `0x${string}`],
    });

    const taBalance = Number(balance) / 10 ** 18; // Assuming 18 decimals

    // Get or create user in database
    const supabase = getSupabaseClient()
    
    const { data: user, error: dbError } = await supabase
      .from("users")
      .upsert(
        [
          {
            wallet_address: walletAddress,
            farcaster_username: farcasterUsername,
            pfp_url: pfpUrl,
            ta_token_balance: taBalance,
            last_checked: new Date().toISOString(),
          },
        ],
        { onConflict: "wallet_address" }
      )
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({
      success: true,
      user: {
        walletAddress,
        username: farcasterUsername,
        pfpUrl,
        taBalance,
      },
    });
  } catch (error) {
    console.error("User check error:", error);
    return NextResponse.json(
      { error: "User check failed" },
      { status: 500 }
    );
  }
}