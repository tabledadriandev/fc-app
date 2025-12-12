import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { pfpUrl, username, taBalance, casts } = await req.json();

    console.log('NFT generation request:', { username, hasPfp: !!pfpUrl, castsCount: casts?.length || 0 });

    if (!username) {
      return NextResponse.json(
        { error: "Username required" },
        { status: 400 }
      );
    }

    // Extract themes from casts if available
    let castContext = "";
    if (casts && Array.isArray(casts) && casts.length > 0) {
      const castTexts = casts.slice(0, 3).map((cast: any) => cast.text || cast.content || "").filter(Boolean);
      if (castTexts.length > 0) {
        castContext = `Based on their recent activity: ${castTexts.join(". ")}. `;
      }
    }

    // Build prompt for Studio Ghibli + DeSci style transformation
    const stylePrompt = `Table d'Adrian member in a DeSci universe, professional anime art style, Studio Ghibli inspired, scientific aesthetic. ${castContext}Premium lab attire, sophisticated demeanor, scientific mastery evident, DeSci researcher. Background: futuristic DeSci research station, scientific laboratory, cutting-edge technology. High resolution, NFT ready, professional portrait, maintain exact facial features and likeness from the original image`;

    let nftImageUrl: string;

    // Use Replicate for true image-to-image transformation to preserve PFP likeness
    const generateWithReplicate = async (imageUrl: string, promptText: string): Promise<string> => {
      try {
        const replicate = new Replicate({
          auth: process.env.REPLICATE_API_TOKEN || "",
        });

        // Clean the PFP URL (remove cache busting params)
        const cleanImageUrl = imageUrl.split('?')[0].split('&')[0];
        
        // Download the PFP image to convert to base64 or use URL directly
        console.log('Downloading PFP for image-to-image transformation:', cleanImageUrl);
        const imageResponse = await fetch(cleanImageUrl, {
          headers: {
            'Accept': 'image/*',
            'Cache-Control': 'no-cache',
          },
        });

        if (!imageResponse.ok) {
          throw new Error(`Failed to download PFP: ${imageResponse.status}`);
        }

        const imageBlob = await imageResponse.blob();
        const imageBuffer = await imageBlob.arrayBuffer();
        const imageBase64 = Buffer.from(imageBuffer).toString('base64');
        const imageDataUrl = `data:${imageBlob.type};base64,${imageBase64}`;

        console.log('PFP downloaded, starting image-to-image transformation with Replicate');

        // Use IP-Adapter FaceID Plus for best likeness preservation
        // This model is specifically designed to preserve facial features
        console.log('Using IP-Adapter FaceID Plus for image-to-image transformation');
        
        try {
          // Try IP-Adapter FaceID Plus first (best for preserving facial features)
          const output = await replicate.run(
            "lucataco/ip-adapter-faceid-plus" as `${string}/${string}`,
            {
              input: {
                image: imageDataUrl,
                prompt: promptText,
                strength: 0.75, // Balance: 0.75 = preserve likeness while applying style
                num_outputs: 1,
                guidance_scale: 7.5,
                num_inference_steps: 30,
                face_strength: 0.8, // High face strength to preserve facial features
              },
            }
          );

          if (output && Array.isArray(output) && output.length > 0) {
            const imageUrl = output[0] as string;
            if (imageUrl && imageUrl.startsWith('http')) {
              console.log('IP-Adapter FaceID Plus transformation successful');
              return imageUrl;
            }
          }
        } catch (ipAdapterError: any) {
          console.log('IP-Adapter FaceID Plus failed, trying regular IP-Adapter:', ipAdapterError?.message);
          
          // Fallback to regular IP-Adapter
          try {
            const output = await replicate.run(
              "lucataco/ip-adapter" as `${string}/${string}`,
              {
                input: {
                  image: imageDataUrl,
                  prompt: promptText,
                  strength: 0.7, // Slightly lower strength to preserve more of original
                  num_outputs: 1,
                  guidance_scale: 7.5,
                  num_inference_steps: 30,
                },
              }
            );

            if (output && Array.isArray(output) && output.length > 0) {
              const imageUrl = output[0] as string;
              if (imageUrl && imageUrl.startsWith('http')) {
                console.log('IP-Adapter transformation successful');
                return imageUrl;
              }
            }
          } catch (ipError: any) {
            console.log('IP-Adapter also failed, trying fofr/image-to-image:', ipError?.message);
            
            // Last fallback: fofr/image-to-image
            try {
              const output = await replicate.run(
                "fofr/image-to-image" as `${string}/${string}`,
                {
                  input: {
                    image: imageDataUrl,
                    prompt: promptText,
                    strength: 0.7,
                    num_outputs: 1,
                  },
                }
              );

              if (output && Array.isArray(output) && output.length > 0) {
                const imageUrl = output[0] as string;
                if (imageUrl && imageUrl.startsWith('http')) {
                  console.log('fofr/image-to-image transformation successful');
                  return imageUrl;
                }
              }
            } catch (fofrError) {
              console.log('All Replicate models failed');
              throw ipAdapterError; // Throw original error
            }
          }
        }

        throw new Error('All image-to-image models failed');
      } catch (error: any) {
        console.error('Replicate image-to-image error:', error);
        throw new Error(`Image transformation failed: ${error?.message || 'Unknown error'}`);
      }
    };

    // Fallback to Pollinations.ai if Replicate fails or no API token
    const generateWithPollinations = async (promptText: string): Promise<string> => {
      try {
        const encodedPrompt = encodeURIComponent(promptText);
        const seed = Math.floor(Math.random() * 1000000);
        const apiUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&model=flux&nologo=true&enhance=true&seed=${seed}`;
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          redirect: 'follow',
          headers: { 'Accept': 'image/*' },
        });
        
        if (!response.ok) {
          throw new Error(`Pollinations API returned status ${response.status}`);
        }
        
        const generatedImageUrl = response.url;
        if (!generatedImageUrl || !generatedImageUrl.startsWith('http')) {
          const imageBlob = await response.blob();
          const imageBuffer = await imageBlob.arrayBuffer();
          const imageBase64 = Buffer.from(imageBuffer).toString('base64');
          return `data:image/png;base64,${imageBase64}`;
        }
        
        return generatedImageUrl;
      } catch (error: any) {
        console.error('Pollinations API error:', error);
        throw new Error(`Pollinations API error: ${error?.message || 'Unknown error'}`);
      }
    };

    if (pfpUrl) {
      // Transform user PFP using image-to-image to preserve exact likeness
      console.log('Generating NFT from PFP with image-to-image transformation:', pfpUrl);
      const cleanPfpUrl = pfpUrl.split('?')[0].split('&')[0];
      const pfpUrlWithCache = `${cleanPfpUrl}?t=${Date.now()}&r=${Math.random()}`;
      
      try {
        // Try Replicate first for true image-to-image
        if (process.env.REPLICATE_API_TOKEN) {
          nftImageUrl = await generateWithReplicate(pfpUrlWithCache, stylePrompt);
          console.log('NFT generated successfully with Replicate image-to-image');
        } else {
          throw new Error('Replicate API token not configured');
        }
      } catch (replicateError) {
        console.log('Replicate failed, falling back to Pollinations:', replicateError);
        // Fallback to Pollinations if Replicate fails
        nftImageUrl = await generateWithPollinations(`${stylePrompt}. Transform this profile picture into the described style while maintaining exact facial features and likeness.`);
        console.log('NFT generated successfully with Pollinations.ai (fallback)');
      }
    } else {
      // Generate from scratch
      console.log('Generating NFT from scratch');
      nftImageUrl = await generateWithPollinations(stylePrompt);
      console.log('NFT generated successfully with Pollinations.ai');
    }

    if (!nftImageUrl || (typeof nftImageUrl === 'string' && nftImageUrl.trim() === '')) {
      console.error('Invalid NFT image URL:', nftImageUrl);
      throw new Error("NFT generation returned no image URL or invalid URL");
    }
    
    // Validate URL format (allow data URLs)
    if (!nftImageUrl.startsWith('http') && !nftImageUrl.startsWith('data:')) {
      try {
        new URL(nftImageUrl);
      } catch (urlError) {
        console.error('Invalid URL format:', nftImageUrl);
        throw new Error(`NFT generation returned invalid URL format`);
      }
    }

    return NextResponse.json({
      success: true,
      nftImage: nftImageUrl,
      nftMetadata: {
        name: `TA NFT: ${username}`,
        description: "Table d'Adrian DeSci NFT",
        image: nftImageUrl,
        artist: "Table d'Adrian",
        collection: "TA DeSci Collection",
      },
    });
  } catch (error: any) {
    console.error("NFT generation error:", error);
    const errorMessage = error instanceof Error ? error.message : (error?.message || String(error));
    const errorDetails = error instanceof Error ? error.stack : (error?.stack || String(error));
    console.error("Error details:", errorDetails);
    console.error("Full error object:", JSON.stringify(error, null, 2));
    
    // Provide more specific error messages
    let userMessage = "Failed to generate NFT. Please try again.";
    if (errorMessage.includes("timeout") || errorMessage.includes("time") || errorMessage.includes("504")) {
      userMessage = "Generation timed out. The AI model may be busy. Please try again in a moment.";
    } else if (errorMessage.includes("invalid URL") || errorMessage.includes("no image URL")) {
      userMessage = "Failed to generate a valid image. Please ensure your profile picture is accessible.";
    } else if (errorMessage) {
      userMessage = `Generation failed: ${errorMessage}`;
    }
    
    return NextResponse.json(
      { 
        error: "Generation failed",
        details: errorMessage,
        message: userMessage,
        fullError: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    );
  }
}

