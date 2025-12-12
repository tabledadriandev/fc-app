import { NextRequest, NextResponse } from "next/server";
import { parseEther } from "viem";

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, nftImageUrl, username } = await req.json();

    if (!walletAddress || !nftImageUrl) {
      return NextResponse.json(
        { error: "Missing wallet or NFT image" },
        { status: 400 }
      );
    }

    const LIQUIDITY_POOL = process.env.NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS;

    if (!LIQUIDITY_POOL) {
      return NextResponse.json(
        { error: "Liquidity pool address not configured" },
        { status: 500 }
      );
    }

    // Simple transaction - just send ETH to liquidity pool
    // NFT ownership is stored in database, no contract needed
    return NextResponse.json({
      success: true,
      transaction: {
        to: LIQUIDITY_POOL as `0x${string}`,
        value: parseEther("0.001"), // 0.001 ETH goes directly to liquidity pool
        chainId: 8453,
        data: "0x", // No contract call needed
      },
      nft: {
        imageUrl: nftImageUrl,
        username,
        name: `TA NFT: ${username}`,
        collection: "Table d'Adrian DeSci Collection",
        price: "0.001 ETH",
        destination: "Your Wallet (stored in database) + Liquidity Pool",
      },
    });
  } catch (error) {
    console.error("Mint error:", error);
    return NextResponse.json(
      { error: "Mint failed" },
      { status: 500 }
    );
  }
}