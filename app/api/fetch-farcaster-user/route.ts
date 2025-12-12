import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');
  const wallet = searchParams.get('wallet');

  if (!username && !wallet) {
    return NextResponse.json(
      { error: 'Username or wallet address required' },
      { status: 400 }
    );
  }

  try {
    let fid: number | null = null;

    // Method 1: Lookup by username using Fname Registry (FREE, no auth)
    if (username) {
      const cleanUsername = username.replace('@', '');
      const fnameResponse = await fetch(
        `https://fnames.farcaster.xyz/transfers/current?name=${cleanUsername}`
      );

      if (fnameResponse.ok) {
        const fnameData = await fnameResponse.json();
        if (fnameData.transfers && fnameData.transfers.length > 0) {
          fid = fnameData.transfers[0].to;
        }
      }
    }

    // Method 2: Lookup by wallet using Pinata Hub (FREE, no auth)
    if (!fid && wallet) {
      const verificationResponse = await fetch(
        `https://hub.pinata.cloud/v1/verificationsByAddress?address=${wallet}`
      );

      if (verificationResponse.ok) {
        const verificationData = await verificationResponse.json();
        if (verificationData.messages && verificationData.messages.length > 0) {
          fid = verificationData.messages[0].data.fid;
        }
      }
    }

    if (!fid) {
      return NextResponse.json(
        { error: 'User not found on Farcaster' },
        { status: 404 }
      );
    }

    // Get user profile data using the FID
    const userDataResponse = await fetch(
      `https://hub.pinata.cloud/v1/userDataByFid?fid=${fid}`
    );

    if (!userDataResponse.ok) {
      throw new Error('Failed to fetch user data');
    }

    const userData = await userDataResponse.json();

    // Extract profile info from messages
    const pfpMessage = userData.messages?.find(
      (msg: any) => msg.data?.userDataBody?.type === 'USER_DATA_TYPE_PFP'
    );

    const usernameMessage = userData.messages?.find(
      (msg: any) => msg.data?.userDataBody?.type === 'USER_DATA_TYPE_USERNAME'
    );

    const displayNameMessage = userData.messages?.find(
      (msg: any) => msg.data?.userDataBody?.type === 'USER_DATA_TYPE_DISPLAY'
    );

    const bioMessage = userData.messages?.find(
      (msg: any) => msg.data?.userDataBody?.type === 'USER_DATA_TYPE_BIO'
    );

    return NextResponse.json({
      success: true,
      fid,
      username: usernameMessage?.data?.userDataBody?.value || null,
      display_name: displayNameMessage?.data?.userDataBody?.value || null,
      pfp_url: pfpMessage?.data?.userDataBody?.value || null,
      bio: bioMessage?.data?.userDataBody?.value || null,
      method: username ? "username" : "wallet",
    });
  } catch (error) {
    console.error('Error fetching Farcaster user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}