import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Handle Farcaster frame requests
    console.log('Received frame request:', body)

    return NextResponse.json({
      type: 'frame',
      status: 'success',
      message: 'Frame request processed',
    })
  } catch (error) {
    console.error('Frame error:', error)
    return NextResponse.json(
      { error: 'Failed to process frame request' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  // Handle frame metadata requests
  return NextResponse.json({
    type: 'frame_metadata',
    title: 'Table d\'Adrian DeSci Whitelist',
    description: 'Join the future of DeSci with $tabledadrian token',
    image: '/ta..PNG',
  })
}