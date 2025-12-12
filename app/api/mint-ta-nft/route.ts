import { NextRequest, NextResponse } from "next/server";
import { parseEther } from "viem";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, nftImageUrl, username } = await req.json();

    console.log('Mint request received:', { walletAddress, hasImage: !!nftImageUrl, username });

    if (!walletAddress || !nftImageUrl) {
      console.error('Missing required fields:', { walletAddress: !!walletAddress, nftImageUrl: !!nftImageUrl });
      return NextResponse.json(
        { error: "Missing wallet or NFT image" },
        { status: 400 }
      );
    }

    const LIQUIDITY_POOL = process.env.NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS;

    if (!LIQUIDITY_POOL) {
      console.error('LIQUIDITY_POOL environment variable not set');
      return NextResponse.json(
        { error: "Liquidity pool address not configured. Please set NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS in environment variables." },
        { status: 500 }
      );
    }

    // Validate liquidity pool address format
    if (!LIQUIDITY_POOL.startsWith('0x') || LIQUIDITY_POOL.length !== 42) {
      console.error('Invalid liquidity pool address format:', LIQUIDITY_POOL);
      return NextResponse.json(
        { error: "Invalid liquidity pool address format" },
        { status: 500 }
      );
    }

    try {
      // Parse the ETH value
      const value = parseEther("0.001");
      console.log('Transaction value parsed:', value.toString());

      // Convert BigInt to hex string for JSON serialization
      // The frontend will convert it back to the proper format
      const valueHex = `0x${value.toString(16)}`;

      // Simple transaction - just send ETH to liquidity pool
      // NFT ownership is stored in database, no contract needed
      const transaction = {
        to: LIQUIDITY_POOL as `0x${string}`,
        value: valueHex, // Send as hex string to avoid BigInt serialization issues
        valueBigInt: value.toString(), // Also include as string for reference
        chainId: 8453,
        data: "0x" as `0x${string}`, // No contract call needed
      };

      console.log('Transaction prepared:', {
        to: transaction.to,
        value: transaction.value,
        chainId: transaction.chainId
      });

      return NextResponse.json({
        success: true,
        transaction,
        nft: {
          imageUrl: nftImageUrl,
          username,
          name: `TA NFT: ${username}`,
          collection: "Table d'Adrian DeSci Collection",
          price: "0.001 ETH",
          destination: "Your Wallet (stored in database) + Liquidity Pool",
        },
      });
    } catch (parseError: any) {
      console.error('Error parsing ether value:', parseError);
      return NextResponse.json(
        { error: `Failed to prepare transaction: ${parseError?.message || 'Unknown error'}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Mint error:", error);
    const errorMessage = error?.message || 'Unknown error';
    const errorStack = error?.stack || '';
    console.error("Error details:", { errorMessage, errorStack });
    
    return NextResponse.json(
      { 
        error: "Mint failed",
        details: errorMessage,
        message: `Mint preparation failed: ${errorMessage}`
      },
      { status: 500 }
    );
  }
}