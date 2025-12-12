import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

export const dynamic = 'force-dynamic';

// Using Pollinations.ai with Flux model - FREE and BEST QUALITY for NFTs
// Flux is currently the state-of-the-art free AI model for high-quality image generation

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
    // Emphasize preserving the exact face, head, and facial features
    const stylePrompt = `Transform this portrait into a Table d'Adrian member in a DeSci universe. Style: professional anime art, Studio Ghibli inspired, scientific aesthetic. ${castContext}IMPORTANT: Keep the EXACT same face, head shape, facial features, expression, and head position from the original image. Only change: add premium lab attire (white coat, scientific equipment), sophisticated DeSci researcher clothing, and a futuristic DeSci research station background with scientific laboratory elements. The face, head, eyes, nose, mouth, and overall facial structure must remain IDENTICAL to the original. High resolution, NFT ready, professional portrait`;

    let nftImageUrl: string;

    // Use Pollinations.ai with Flux model - FREE, BEST QUALITY for NFTs
    // Flux is currently the best free AI model for high-quality image generation
    const generateWithFlux = async (imageUrl: string, promptText: string): Promise<string> => {
      try {
        // Clean the PFP URL
        const cleanImageUrl = imageUrl.split('?')[0].split('&')[0];
        
        console.log('Using Pollinations.ai Flux model (best free NFT generator)');
        
        // Pollinations.ai supports Flux model which is state-of-the-art for NFTs
        // Encode prompt with image reference for image-to-image transformation
        const encodedPrompt = encodeURIComponent(promptText);
        const seed = Math.floor(Math.random() * 1000000);
        
        // Use Flux model via Pollinations - best free quality
        // Add image parameter for image-to-image transformation
        let apiUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&model=flux&nologo=true&enhance=true&seed=${seed}&image=${encodeURIComponent(cleanImageUrl)}`;
        
        console.log('Generating with Flux model (best free AI for NFTs)');
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          redirect: 'follow',
          headers: {
            'Accept': 'image/*',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Flux API returned status ${response.status}`);
        }
        
        // Get the final image URL
        const generatedImageUrl = response.url;
        
        if (!generatedImageUrl || !generatedImageUrl.startsWith('http')) {
          // Convert blob to data URL
          const imageBlob = await response.blob();
          const imageBuffer = await imageBlob.arrayBuffer();
          const imageBase64 = Buffer.from(imageBuffer).toString('base64');
          return `data:image/png;base64,${imageBase64}`;
        }
        
        console.log('Flux model generation successful - best quality NFT created');
        return generatedImageUrl;
      } catch (error: any) {
        console.error('Flux generation error:', error);
        throw new Error(`Flux generation failed: ${error?.message || 'Unknown error'}`);
      }
    };

    // Use Replicate for true image-to-image transformation to preserve PFP likeness (fallback)
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

        // Use IP-Adapter FaceID Plus for best face/head preservation
        // This model is specifically designed to preserve facial features
        console.log('Using IP-Adapter FaceID Plus for face-preserving image-to-image transformation');
        
        try {
          // Try IP-Adapter FaceID Plus first (best for preserving facial features and head)
          // Lower strength = more original image preserved, higher face_strength = better face preservation
          const output = await replicate.run(
            "lucataco/ip-adapter-faceid-plus" as `${string}/${string}`,
            {
              input: {
                image: imageDataUrl,
                prompt: promptText,
                strength: 0.65, // Lower strength to preserve more of original face/head
                num_outputs: 1,
                guidance_scale: 7.0, // Slightly lower guidance for more faithful transformation
                num_inference_steps: 40, // More steps for better quality
                face_strength: 0.95, // Very high face strength to preserve exact facial features
                controlnet_conditioning_scale: 0.8, // Control how much the original image influences the result
              },
            }
          );

          if (output && Array.isArray(output) && output.length > 0) {
            const imageUrl = output[0] as string;
            if (imageUrl && imageUrl.startsWith('http')) {
              console.log('IP-Adapter FaceID Plus transformation successful with high face preservation');
              return imageUrl;
            }
          }
        } catch (ipAdapterError: any) {
          console.log('IP-Adapter FaceID Plus failed, trying face-swap model:', ipAdapterError?.message);
          
          // Try face-swap model as alternative for better face preservation
          try {
            const output = await replicate.run(
              "yan-ops/face_swap" as `${string}/${string}`,
              {
                input: {
                  source_image: imageDataUrl,
                  target_image: imageDataUrl, // Use same image as target
                  prompt: promptText,
                },
              }
            );

            if (output && Array.isArray(output) && output.length > 0) {
              const imageUrl = output[0] as string;
              if (imageUrl && imageUrl.startsWith('http')) {
                console.log('Face swap transformation successful');
                return imageUrl;
              }
            }
          } catch (faceSwapError: any) {
            console.log('Face swap failed, trying regular IP-Adapter with high face preservation:', faceSwapError?.message);
            
            // Fallback to regular IP-Adapter with optimized settings for face preservation
            try {
              const output = await replicate.run(
                "lucataco/ip-adapter" as `${string}/${string}`,
                {
                  input: {
                    image: imageDataUrl,
                    prompt: promptText,
                    strength: 0.6, // Lower strength to preserve more of original face/head
                    num_outputs: 1,
                    guidance_scale: 6.5, // Lower guidance for more faithful face preservation
                    num_inference_steps: 40,
                  },
                }
              );

              if (output && Array.isArray(output) && output.length > 0) {
                const imageUrl = output[0] as string;
                if (imageUrl && imageUrl.startsWith('http')) {
                  console.log('IP-Adapter transformation successful with optimized face preservation');
                  return imageUrl;
                }
              }
            } catch (ipError: any) {
              console.log('IP-Adapter also failed, trying fofr/image-to-image with low strength:', ipError?.message);
              
              // Last fallback: fofr/image-to-image with very low strength for face preservation
              try {
                const output = await replicate.run(
                  "fofr/image-to-image" as `${string}/${string}`,
                  {
                    input: {
                      image: imageDataUrl,
                      prompt: promptText,
                      strength: 0.5, // Very low strength to preserve original face/head
                      num_outputs: 1,
                    },
                  }
                );

                if (output && Array.isArray(output) && output.length > 0) {
                  const imageUrl = output[0] as string;
                  if (imageUrl && imageUrl.startsWith('http')) {
                    console.log('fofr/image-to-image transformation successful with low strength');
                    return imageUrl;
                  }
                }
              } catch (fofrError) {
                console.log('All Replicate models failed');
                throw ipAdapterError; // Throw original error
              }
            }
          }
        }

        throw new Error('All image-to-image models failed');
      } catch (error: any) {
        console.error('Replicate image-to-image error:', error);
        throw new Error(`Image transformation failed: ${error?.message || 'Unknown error'}`);
      }
    };

    // Fallback to Pollinations.ai with Flux model (free, high quality)
    const generateWithPollinations = async (promptText: string): Promise<string> => {
      try {
        const encodedPrompt = encodeURIComponent(promptText);
        const seed = Math.floor(Math.random() * 1000000);
        // Use Flux model - best free quality for NFTs
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
      // Transform user PFP using best free AI model (Hugging Face Flux)
      console.log('Generating NFT from PFP with best free AI model (Hugging Face Flux):', pfpUrl);
      const cleanPfpUrl = pfpUrl.split('?')[0].split('&')[0];
      const pfpUrlWithCache = `${cleanPfpUrl}?t=${Date.now()}&r=${Math.random()}`;
      
      try {
        // Use Flux model first (FREE, BEST QUALITY for NFTs)
        nftImageUrl = await generateWithFlux(pfpUrlWithCache, stylePrompt);
        console.log('NFT generated successfully with Flux model (best free AI for NFTs)');
      } catch (fluxError) {
        console.log('Flux model failed, trying Replicate as fallback:', fluxError);
        try {
          // Fallback to Replicate if available (for better face preservation)
          if (process.env.REPLICATE_API_TOKEN) {
            nftImageUrl = await generateWithReplicate(pfpUrlWithCache, stylePrompt);
            console.log('NFT generated successfully with Replicate (fallback)');
          } else {
            throw new Error('Replicate API token not configured');
          }
        } catch (replicateError) {
          console.log('Replicate also failed, falling back to Pollinations:', replicateError);
          // Last fallback to Pollinations with Flux
          nftImageUrl = await generateWithPollinations(`${stylePrompt}. Transform this profile picture into the described style while maintaining exact facial features and likeness.`);
          console.log('NFT generated successfully with Pollinations.ai Flux (last fallback)');
        }
      }
    } else {
      // Generate from scratch using best free model
      console.log('Generating NFT from scratch with Hugging Face Flux');
      try {
        // For text-to-image, use Pollinations with Flux model (free)
        nftImageUrl = await generateWithPollinations(stylePrompt);
        console.log('NFT generated successfully with Pollinations.ai Flux');
      } catch (pollError) {
        console.log('Pollinations failed:', pollError);
        throw pollError;
      }
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

