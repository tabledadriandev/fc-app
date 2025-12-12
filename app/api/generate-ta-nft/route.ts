import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(req: NextRequest) {
  try {
    const { pfpUrl, username, taBalance, casts } = await req.json();

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
    const prompt = `Portrait of ${username}, DeSci researcher, Table d'Adrian NFT collection. 
    ${castContext}Style: professional anime art, Studio Ghibli inspired, scientific aesthetic. 
    Features: Premium lab attire, sophisticated demeanor, scientific mastery evident. 
    Background: luxury lab, high-end research station. 
    Quality: high resolution, NFT ready, professional portrait, unique character design`;

    let nftImageUrl: string;

    if (pfpUrl) {
      // Transform user PFP into TA chef NFT portrait
      const output = await replicate.run("aaronaftab/mirage-ghibli", {
        input: {
          image: pfpUrl,
          prompt,
          strength: 0.75,
          guidance_scale: 8,
          num_inference_steps: 35,
        },
      });
      nftImageUrl = Array.isArray(output) ? output[0] : output as unknown as string;
    } else {
      // Generate from scratch
      const output = await replicate.run("cjwbw/animagine-xl-3.1", {
        input: {
          prompt,
          negative_prompt: "blurry, low quality, amateur",
          guidance_scale: 8,
          num_inference_steps: 35,
        },
      });
      nftImageUrl = Array.isArray(output) ? output[0] : output as unknown as string;
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
  } catch (error) {
    console.error("NFT generation error:", error);
    return NextResponse.json(
      { error: "Generation failed" },
      { status: 500 }
    );
  }
}
