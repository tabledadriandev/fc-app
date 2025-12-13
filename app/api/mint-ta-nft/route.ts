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

    // Recipient address - can be your wallet address or liquidity pool address
    // Must be an EOA (Externally Owned Account) that can receive ETH directly
    const RECIPIENT_ADDRESS = process.env.NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS;

    if (!RECIPIENT_ADDRESS) {
      console.error('RECIPIENT_ADDRESS environment variable not set');
      return NextResponse.json(
        { error: "Recipient address not configured. Please set NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS in environment variables (can be your wallet address)." },
        { status: 500 }
      );
    }

    // Validate recipient address format (must be valid Ethereum address)
    if (!RECIPIENT_ADDRESS.startsWith('0x') || RECIPIENT_ADDRESS.length !== 42) {
      console.error('Invalid recipient address format:', RECIPIENT_ADDRESS);
      return NextResponse.json(
        { error: "Invalid recipient address format. Must be a valid Ethereum address (0x followed by 40 hex characters)." },
        { status: 500 }
      );
    }

    try {
      // Parse the ETH value (0.0001 ETH = 100000000000000 wei)
      const valueWei = parseEther("0.0001");
      console.log('Transaction value parsed (wei):', valueWei.toString());

      // Convert BigInt to hex string for JSON serialization
      // Must be a hex string starting with 0x for Ethereum transactions
      const valueHex = `0x${valueWei.toString(16)}`;
      console.log('Transaction value (hex):', valueHex);

      // Simple transaction - just send ETH to recipient address (your wallet)
      // NFT ownership is stored in database, no contract needed
      const transaction = {
        to: RECIPIENT_ADDRESS as `0x${string}`,
        value: valueHex, // Hex string - this is what Ethereum expects
        chainId: 8453,
        data: "0x" as `0x${string}`, // No contract call needed - plain ETH transfer
      };

      console.log('Transaction prepared:', {
        to: transaction.to,
        value: transaction.value,
        chainId: transaction.chainId
      });

      // Ensure we're returning a plain object that can be serialized
      const response = {
        success: true,
        transaction: {
          to: transaction.to,
          value: transaction.value, // Already a string
          chainId: transaction.chainId,
          data: transaction.data,
        },
        nft: {
          imageUrl: nftImageUrl,
          username,
          name: `TA NFT: ${username}`,
          collection: "Table d'Adrian DeSci Collection",
          price: "0.0001 ETH",
          destination: "Your Wallet (stored in database) + Recipient Address",
        },
      };

      return NextResponse.json(response);
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