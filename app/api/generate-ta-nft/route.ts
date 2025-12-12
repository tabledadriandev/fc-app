import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

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

    // Check if Replicate API token is configured
    if (!process.env.REPLICATE_API_TOKEN) {
      console.error("REPLICATE_API_TOKEN is not set");
      return NextResponse.json(
        { error: "Replicate API token is not configured" },
        { status: 500 }
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

    // Build prompt emphasizing Table d'Adrian branding + user DNA/PFP + casts
    const prompt = `Portrait of ${username}, DeSci researcher, Table d'Adrian NFT collection. 
    ${castContext}Style: professional anime art, Studio Ghibli inspired, scientific aesthetic. 
    Features: Premium lab attire, sophisticated demeanor, scientific mastery evident. 
    Background: luxury lab, high-end research station. 
    Quality: high resolution, NFT ready, professional portrait, unique character design`;

    let nftImageUrl: string;

    if (pfpUrl) {
      // Transform user PFP into TA chef NFT portrait
      console.log('Generating NFT from PFP:', pfpUrl);
      try {
        // Try multiple models that support image-to-image transformation
        let output: any = null;
        let lastError: any = null;
        
        // Model 1: Try stability-ai/sdxl (supports image input)
        try {
          output = await replicate.run("stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b", {
            input: {
              image: pfpUrl,
              prompt: prompt,
              num_outputs: 1,
              guidance_scale: 7.5,
              num_inference_steps: 30,
            },
          });
          console.log('Successfully used stability-ai/sdxl model');
        } catch (err1: any) {
          console.log('Model stability-ai/sdxl failed, trying alternative:', err1?.message);
          lastError = err1;
          
          // Model 2: Try black-forest-labs/flux-schnell (alternative)
          try {
            output = await replicate.run("black-forest-labs/flux-schnell", {
              input: {
                image: pfpUrl,
                prompt: prompt,
                num_outputs: 1,
              },
            });
            console.log('Successfully used black-forest-labs/flux-schnell model');
          } catch (err2: any) {
            console.log('Model black-forest-labs/flux-schnell failed, trying alternative:', err2?.message);
            lastError = err2;
            
            // Model 3: Try lucataco/sdxl-lightning (fallback - may not support image input)
            try {
              output = await replicate.run("lucataco/sdxl-lightning", {
                input: {
                  prompt: `${prompt}, inspired by the image: ${pfpUrl}`,
                  num_outputs: 1,
                  guidance_scale: 3,
                  num_inference_steps: 4,
                },
              });
              console.log('Successfully used lucataco/sdxl-lightning model (text-only fallback)');
            } catch (err3: any) {
              console.log('All models failed, using last error:', err3?.message);
              lastError = err3;
              throw new Error(`All Replicate models failed. Last error: ${err3?.message || 'Unknown error'}`);
            }
          }
        }
        
        if (!output) {
          throw lastError || new Error('No output from Replicate API');
        }
        console.log('Replicate output type:', typeof output, 'Is array:', Array.isArray(output), 'Output:', output);
        
        // Handle different output formats
        if (Array.isArray(output)) {
          nftImageUrl = output[0] as string;
        } else if (typeof output === 'string') {
          nftImageUrl = output;
        } else if (output && typeof output === 'object' && 'output' in output) {
          const outputValue = (output as any).output;
          nftImageUrl = Array.isArray(outputValue) ? outputValue[0] : outputValue;
        } else {
          nftImageUrl = output as unknown as string;
        }
        
        console.log('NFT generated successfully:', nftImageUrl);
      } catch (replicateError: any) {
        console.error('Replicate API error:', replicateError);
        const errorMsg = replicateError?.message || replicateError?.error || String(replicateError);
        throw new Error(`Replicate API error: ${errorMsg}`);
      }
    } else {
      // Generate from scratch
      console.log('Generating NFT from scratch');
      try {
        // Try multiple models for reliability
        let output: any = null;
        let lastError: any = null;
        
        // Model 1: Try lucataco/sdxl-lightning (fast and reliable)
        try {
          output = await replicate.run("lucataco/sdxl-lightning", {
            input: {
              prompt: prompt,
              num_outputs: 1,
              guidance_scale: 3,
              num_inference_steps: 4,
            },
          });
          console.log('Successfully used lucataco/sdxl-lightning model');
        } catch (err1: any) {
          console.log('Model lucataco/sdxl-lightning failed, trying alternative:', err1?.message);
          lastError = err1;
          
          // Model 2: Try black-forest-labs/flux-schnell (alternative)
          try {
            output = await replicate.run("black-forest-labs/flux-schnell", {
              input: {
                prompt: prompt,
                num_outputs: 1,
              },
            });
            console.log('Successfully used black-forest-labs/flux-schnell model');
          } catch (err2: any) {
            console.log('Model black-forest-labs/flux-schnell failed, trying alternative:', err2?.message);
            lastError = err2;
            
            // Model 3: Try cjwbw/animagine-xl-3.1 (anime style)
            try {
              output = await replicate.run("cjwbw/animagine-xl-3.1", {
                input: {
                  prompt,
                  negative_prompt: "blurry, low quality, amateur",
                  guidance_scale: 8,
                  num_inference_steps: 35,
                },
              });
              console.log('Successfully used cjwbw/animagine-xl-3.1 model');
            } catch (err3: any) {
              console.log('All models failed, using last error:', err3?.message);
              lastError = err3;
              throw new Error(`All Replicate models failed. Last error: ${err3?.message || 'Unknown error'}`);
            }
          }
        }
        
        if (!output) {
          throw lastError || new Error('No output from Replicate API');
        }
        console.log('Replicate output type:', typeof output, 'Is array:', Array.isArray(output), 'Output:', output);
        
        // Handle different output formats
        if (Array.isArray(output)) {
          nftImageUrl = output[0] as string;
        } else if (typeof output === 'string') {
          nftImageUrl = output;
        } else if (output && typeof output === 'object' && 'output' in output) {
          const outputValue = (output as any).output;
          nftImageUrl = Array.isArray(outputValue) ? outputValue[0] : outputValue;
        } else {
          nftImageUrl = output as unknown as string;
        }
        
        console.log('NFT generated successfully:', nftImageUrl);
      } catch (replicateError: any) {
        console.error('Replicate API error:', replicateError);
        const errorMsg = replicateError?.message || replicateError?.error || String(replicateError);
        throw new Error(`Replicate API error: ${errorMsg}`);
      }
    }

    if (!nftImageUrl || (typeof nftImageUrl === 'string' && nftImageUrl.trim() === '')) {
      console.error('Invalid NFT image URL:', nftImageUrl);
      throw new Error("NFT generation returned no image URL or invalid URL");
    }
    
    // Validate URL format
    try {
      new URL(nftImageUrl);
    } catch (urlError) {
      console.error('Invalid URL format:', nftImageUrl);
      throw new Error(`NFT generation returned invalid URL: ${nftImageUrl}`);
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
    if (errorMessage.includes("REPLICATE_API_TOKEN") || errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
      userMessage = "Replicate API token is missing or invalid. Please check your environment variables.";
    } else if (errorMessage.includes("timeout") || errorMessage.includes("time") || errorMessage.includes("504")) {
      userMessage = "Generation timed out. The AI model may be busy. Please try again in a moment.";
    } else if (errorMessage.includes("429") || errorMessage.includes("rate limit")) {
      userMessage = "Rate limit exceeded. Please wait a moment and try again.";
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

