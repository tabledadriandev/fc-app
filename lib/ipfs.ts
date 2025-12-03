import axios from 'axios'
import FormData from 'form-data'

const PINATA_API_KEY = process.env.PINATA_API_KEY!
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY!
const PINATA_JWT = process.env.PINATA_JWT!

/**
 * Upload file to IPFS via Pinata
 */
export async function uploadToIPFS(
  fileBuffer: Buffer,
  fileName: string
): Promise<{ success: boolean; hash?: string; error?: string }> {
  try {
    const formData = new FormData()
    formData.append('file', fileBuffer, {
      filename: fileName,
      contentType: 'application/pdf',
    })

    // Pinata metadata
    const metadata = JSON.stringify({
      name: fileName,
      keyvalues: {
        type: 'wellness-plan',
        timestamp: new Date().toISOString(),
      },
    })
    formData.append('pinataMetadata', metadata)

    // Pinata options
    const options = JSON.stringify({
      cidVersion: 0,
    })
    formData.append('pinataOptions', options)

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        headers: {
          Authorization: `Bearer ${PINATA_JWT}`,
          ...formData.getHeaders(),
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    )

    if (response.data && response.data.IpfsHash) {
      return {
        success: true,
        hash: response.data.IpfsHash,
      }
    }

    return {
      success: false,
      error: 'No hash returned from Pinata',
    }
  } catch (error: any) {
    console.error('IPFS upload error:', error)
    return {
      success: false,
      error: error.message || 'Failed to upload to IPFS',
    }
  }
}

/**
 * Generate time-limited download URL with expiry
 */
export function generateDownloadUrl(ipfsHash: string, expiresInHours: number = 24): string {
  // For now, return the Pinata gateway URL
  // In production, you might want to use signed URLs or a proxy
  return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
}

