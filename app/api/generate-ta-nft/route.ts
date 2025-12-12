import { NextRequest, NextResponse } from "next/server";

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

    // Build prompt emphasizing Table d'Adrian branding + user DNA/PFP + casts
    const prompt = `Portrait of ${username}, Table d'Adrian member in a DeSci universe, Table d'Adrian NFT collection. 
    ${castContext}Style: professional anime art, Studio Ghibli inspired, scientific aesthetic. 
    Features: Premium lab attire, sophisticated demeanor, scientific mastery evident, DeSci researcher. 
    Background: futuristic DeSci research station, scientific laboratory, cutting-edge technology. 
    Quality: high resolution, NFT ready, professional portrait, unique character design`;

    let nftImageUrl: string;

    // Use Pollinations.ai - completely free, no API key needed, no rate limits
    // API endpoint: https://image.pollinations.ai/prompt/{prompt}
    const generateWithPollinations = async (promptText: string, imageUrl?: string): Promise<string> => {
      try {
        // Encode prompt for URL
        const encodedPrompt = encodeURIComponent(promptText);
        // Use flux model for better quality, set dimensions
        let apiUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&model=flux&nologo=true&enhance=true`;
        
        console.log('Generating with Pollinations.ai');
        
        // Pollinations returns the image directly as a URL
        // The API returns a redirect to the generated image
        const response = await fetch(apiUrl, {
          method: 'GET',
          redirect: 'follow',
          headers: {
            'Accept': 'image/*',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Pollinations API returned status ${response.status}`);
        }
        
        // Get the final image URL from the response
        const imageUrl = response.url;
        
        if (!imageUrl || !imageUrl.startsWith('http')) {
          // If we don't get a direct URL, convert blob to data URL
          const imageBlob = await response.blob();
          const imageBuffer = await imageBlob.arrayBuffer();
          const imageBase64 = Buffer.from(imageBuffer).toString('base64');
          return `data:image/png;base64,${imageBase64}`;
        }
        
        return imageUrl;
      } catch (error: any) {
        console.error('Pollinations API error:', error);
        throw new Error(`Pollinations API error: ${error?.message || 'Unknown error'}`);
      }
    };

    if (pfpUrl) {
      // Transform user PFP - enhance prompt with image reference
      console.log('Generating NFT from PFP:', pfpUrl);
      const enhancedPrompt = `${prompt}, based on this profile picture: ${pfpUrl}`;
      nftImageUrl = await generateWithPollinations(enhancedPrompt, pfpUrl);
      console.log('NFT generated successfully with Pollinations.ai');
    } else {
      // Generate from scratch
      console.log('Generating NFT from scratch');
      nftImageUrl = await generateWithPollinations(prompt);
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

