import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fid = searchParams.get('fid');
  const username = searchParams.get('username');

  if (!fid && !username) {
    return NextResponse.json({ error: 'FID or username required' }, { status: 400 });
  }

  try {
    let targetFid = fid;

    // If username provided, get FID first
    if (!targetFid && username) {
      const cleanUsername = username.replace('@', '');
      const userRes = await fetch(`https://api.farcaster.xyz/v2/user-by-username?username=${cleanUsername}`);
      if (userRes.ok) {
        const userData = await userRes.json();
        targetFid = userData.user?.fid?.toString();
      }
    }

    if (!targetFid) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch casts from Farcaster API
    const castsRes = await fetch(`https://api.farcaster.xyz/v2/casts?fid=${targetFid}&limit=10`);
    
    if (!castsRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch casts' }, { status: 500 });
    }

    const castsData = await castsRes.json();
    const casts = castsData.result?.casts || [];

    // Extract relevant cast data with more details for better AI generation
    const formattedCasts = casts.map((cast: any) => ({
      hash: cast.hash,
      text: cast.text || cast.content || "",
      timestamp: cast.timestamp,
      embeds: cast.embeds || [],
      mentions: cast.mentions || [],
      reactions: cast.reactions || { count: 0 },
      recasts: cast.recasts || { count: 0 },
      // Include parent cast if it's a reply for context
      parentText: cast.parent?.text || null,
    }));

    return NextResponse.json({
      fid: targetFid,
      casts: formattedCasts,
      count: formattedCasts.length,
    });

  } catch (error) {
    console.error('Error fetching casts:', error);
    return NextResponse.json({
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

