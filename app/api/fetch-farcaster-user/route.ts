import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');
  const wallet = searchParams.get('wallet');

  if (!username && !wallet) {
    return NextResponse.json({ error: 'Username or wallet required' }, { status: 400 });
  }

  try {
    let fid: number | null = null;

    // Step 1: Get FID from username
    if (username) {
      const cleanUsername = username.replace('@', '');
      const res = await fetch(`https://fnames.farcaster.xyz/transfers/current?name=${cleanUsername}`);
      if (res.ok) {
        const data = await res.json();
        fid = data.transfers?.[0]?.to || null;
      }
    }

    // Step 2: Get FID from wallet
    if (!fid && wallet) {
      const res = await fetch(`https://api.noderpc.xyz/farcaster-mainnet-hub/v1/verificationsByAddress?address=${wallet}`);
      if (res.ok) {
        const data = await res.json();
        fid = data.messages?.[0]?.data?.fid || null;
      }
    }

    if (!fid) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Step 3: Get profile data
    const profileRes = await fetch(`https://api.noderpc.xyz/farcaster-mainnet-hub/v1/userDataByFid?fid=${fid}`);
    const profileData = await profileRes.json();

    const pfp = profileData.messages?.find((m: any) => m.data?.userDataBody?.type === 'USER_DATA_TYPE_PFP');
    const user = profileData.messages?.find((m: any) => m.data?.userDataBody?.type === 'USER_DATA_TYPE_USERNAME');

    return NextResponse.json({
      fid,
      username: user?.data?.userDataBody?.value || null,
      pfp_url: pfp?.data?.userDataBody?.value || null,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}