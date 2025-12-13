import { NextRequest, NextResponse } from "next/server";
import { parseEther, encodeFunctionData } from "viem";
import { TANFT_ABI } from "../../../lib/blockchain";
import { TANFT_CONTRACT_ADDRESS } from "../../../lib/config";

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

    // TANFT contract address for minting NFTs
    if (!TANFT_CONTRACT_ADDRESS) {
      console.error('TANFT_CONTRACT_ADDRESS environment variable not set');
      return NextResponse.json(
        { error: "TANFT contract address not configured. Please set NEXT_PUBLIC_TANFT_CONTRACT_ADDRESS in environment variables." },
        { status: 500 }
      );
    }

    // Validate contract address format (must be valid Ethereum address)
    if (!TANFT_CONTRACT_ADDRESS.startsWith('0x') || TANFT_CONTRACT_ADDRESS.length !== 42) {
      console.error('Invalid TANFT contract address format:', TANFT_CONTRACT_ADDRESS);
      return NextResponse.json(
        { error: "Invalid TANFT contract address format. Must be a valid Ethereum address (0x followed by 40 hex characters)." },
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

      // Call TANFT contract mint function
      const mintData = encodeFunctionData({
        abi: TANFT_ABI,
        functionName: 'mint',
        args: [walletAddress as `0x${string}`, nftImageUrl]
      });

      const transaction = {
        to: TANFT_CONTRACT_ADDRESS as `0x${string}`,
        value: valueHex, // Hex string - this is what Ethereum expects
        chainId: 8453,
        data: mintData, // Encoded mint function call
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
          destination: "TANFT Contract (0xfd7566e7e103b2233952296793443e8af9d1f118)",
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