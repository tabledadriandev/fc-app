import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateWellnessPDF } from '@/lib/pdf-generator'
import { uploadToIPFS } from '@/lib/ipfs'

export async function POST(req: NextRequest) {
  try {
    const { userId, assessment } = await req.json()

    if (!userId || !assessment) {
      return NextResponse.json(
        { error: 'userId and assessment are required' },
        { status: 400 }
      )
    }

    // Validate assessment data
    const { goal, challenges, lifestyle, dietary, conditions } = assessment
    if (!goal || !challenges || !lifestyle || !dietary) {
      return NextResponse.json(
        { error: 'Missing required assessment fields' },
        { status: 400 }
      )
    }

    // Generate PDF
    const pdfBuffer = await generateWellnessPDF(assessment)

    // Upload to IPFS
    const ipfsResult = await uploadToIPFS(pdfBuffer, `wellness-plan-${userId}-${Date.now()}.pdf`)

    if (!ipfsResult.success || !ipfsResult.hash) {
      return NextResponse.json(
        { error: 'Failed to upload PDF to IPFS' },
        { status: 500 }
      )
    }

    // Calculate expiry (24 hours from now)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    // Update assessment with PDF info
    const { error: updateError } = await supabaseAdmin
      .from('assessments')
      .update({
        pdf_generated: true,
        pdf_url: `https://gateway.pinata.cloud/ipfs/${ipfsResult.hash}`,
        ipfs_hash: ipfsResult.hash,
        pdf_expires_at: expiresAt.toISOString(),
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating assessment:', updateError)
      // Continue anyway - PDF is generated
    }

    // Increment user's assessment count
    const { data: assessmentData } = await supabaseAdmin
      .from('assessments')
      .select('user_id')
      .eq('id', userId)
      .single()

    if (assessmentData) {
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('assessment_count')
        .eq('id', assessmentData.user_id)
        .single()

      if (userData) {
        await supabaseAdmin
          .from('users')
          .update({
            assessment_count: (userData.assessment_count || 0) + 1,
          })
          .eq('id', assessmentData.user_id)
      }
    }

    return NextResponse.json({
      success: true,
      pdfUrl: `https://gateway.pinata.cloud/ipfs/${ipfsResult.hash}`,
      ipfsHash: ipfsResult.hash,
      expiresAt: expiresAt.toISOString(),
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

