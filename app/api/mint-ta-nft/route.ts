import { NextRequest, NextResponse } from "next/server";
import { parseEther, encodeFunctionData } from "viem";

// Standard ERC721 mint function ABI
const MINT_ABI = [
  {
    name: "mint",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "to", type: "address" },
      { name: "tokenURI", type: "string" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, nftImageUrl, username } = await req.json();

    if (!walletAddress || !nftImageUrl) {
      return NextResponse.json(
        { error: "Missing wallet or NFT image" },
        { status: 400 }
      );
    }

    const NFT_CONTRACT = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS;
    const LIQUIDITY_POOL = process.env.NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS;

    if (!NFT_CONTRACT) {
      return NextResponse.json(
        { error: "NFT contract address not configured" },
        { status: 500 }
      );
    }

    // Create token URI (can be IPFS or HTTP URL)
    const tokenURI = nftImageUrl;

    // Encode mint function call
    const mintData = encodeFunctionData({
      abi: MINT_ABI,
      functionName: "mint",
      args: [walletAddress as `0x${string}`, tokenURI],
    });

    // Return transaction for user to sign - mints NFT to their wallet
    // 0.003 ETH goes to liquidity pool as payment
    return NextResponse.json({
      success: true,
      transaction: {
        to: NFT_CONTRACT as `0x${string}`,
        value: parseEther("0.003"), // Payment goes to contract, which forwards to LP
        chainId: 8453,
        data: mintData,
      },
      nft: {
        imageUrl: nftImageUrl,
        username,
        name: `TA NFT: ${username}`,
        collection: "Table d'Adrian DeSci Collection",
        price: "0.003 ETH",
        destination: "Your Wallet + Liquidity Pool",
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