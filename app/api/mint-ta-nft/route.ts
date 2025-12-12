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

    // Return transaction for user to sign
    return NextResponse.json({
      success: true,
      transaction: {
        to: LIQUIDITY_POOL,
        value: parseEther("0.003"),
        chainId: 8453,
        data: "0x",
      },
      nft: {
        imageUrl: nftImageUrl,
        username,
        name: `TA NFT: ${username}`,
        collection: "Table d'Adrian Chef Collection",
        price: "0.003 ETH",
        destination: "Liquidity Pool (+$TA value)",
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