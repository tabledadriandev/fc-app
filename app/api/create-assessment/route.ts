import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { userId, assessment } = await req.json()

    if (!userId || !assessment) {
      return NextResponse.json(
        { error: 'userId and assessment are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('assessments')
      .insert({
        user_id: userId,
        goal: assessment.goal,
        challenges: assessment.challenges,
        lifestyle: assessment.lifestyle,
        dietary: assessment.dietary,
        conditions: assessment.conditions || null,
      })
      .select()
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Failed to create assessment' },
        { status: 500 }
      )
    }

    return NextResponse.json({ assessmentId: data.id })
  } catch (error) {
    console.error('Create assessment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

