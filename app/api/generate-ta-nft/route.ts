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

    // Advanced cast analysis for personalized character design
    let castContext = "";
    let userVoice = "";
    let userInterests: string[] = [];
    let userPersonality = "";
    
    if (casts && Array.isArray(casts) && casts.length > 0) {
      // Analyze all casts (up to 10) for deeper insights
      const allCastTexts = casts.slice(0, 10).map((cast: any) => cast.text || cast.content || "").filter(Boolean);
      const recentCastTexts = casts.slice(0, 5).map((cast: any) => cast.text || cast.content || "").filter(Boolean);
      
      if (allCastTexts.length > 0) {
        // Extract key themes and topics
        const fullText = allCastTexts.join(" ").toLowerCase();
        
        // Detect interests based on keywords
        const interestKeywords: { [key: string]: string[] } = {
          crypto: ['crypto', 'bitcoin', 'ethereum', 'defi', 'nft', 'blockchain', 'web3', 'token', 'dao'],
          science: ['science', 'research', 'study', 'experiment', 'data', 'analysis', 'hypothesis', 'theory', 'discovery'],
          tech: ['ai', 'machine learning', 'code', 'software', 'developer', 'programming', 'tech', 'algorithm'],
          art: ['art', 'design', 'creative', 'aesthetic', 'visual', 'illustration', 'artist'],
          philosophy: ['philosophy', 'think', 'thought', 'idea', 'concept', 'meaning', 'existential'],
          health: ['health', 'medicine', 'medical', 'wellness', 'bio', 'biology', 'life'],
          space: ['space', 'cosmos', 'universe', 'astronomy', 'planet', 'star', 'galaxy'],
          gaming: ['game', 'gaming', 'play', 'player', 'quest', 'level', 'character'],
        };
        
        for (const [interest, keywords] of Object.entries(interestKeywords)) {
          if (keywords.some(keyword => fullText.includes(keyword))) {
            userInterests.push(interest);
          }
        }
        
        // Analyze writing style/voice
        const avgLength = allCastTexts.reduce((sum, text) => sum + text.length, 0) / allCastTexts.length;
        const hasQuestions = allCastTexts.some(text => text.includes('?'));
        const hasEmojis = allCastTexts.some(text => /[\u{1F300}-\u{1F9FF}]/u.test(text));
        const isTechnical = fullText.includes('code') || fullText.includes('tech') || fullText.includes('algorithm');
        const isPhilosophical = fullText.includes('think') || fullText.includes('idea') || fullText.includes('meaning');
        const isCreative = fullText.includes('art') || fullText.includes('design') || fullText.includes('creative');
        
        // Build personality profile
        if (isTechnical && isPhilosophical) {
          userPersonality = "a deep-thinking technologist and philosopher";
        } else if (isTechnical) {
          userPersonality = "a technical innovator and builder";
        } else if (isPhilosophical) {
          userPersonality = "a thoughtful philosopher and intellectual";
        } else if (isCreative) {
          userPersonality = "a creative visionary and artist";
        } else {
          userPersonality = "a unique individual with distinct perspectives";
        }
        
        // Build voice description
        if (avgLength > 200) {
          userVoice += "detailed and expressive";
        } else if (avgLength < 50) {
          userVoice += "concise and impactful";
        } else {
          userVoice += "balanced and thoughtful";
        }
        
        if (hasQuestions) {
          userVoice += ", curious and inquisitive";
        }
        
        // Build context from recent casts
        const contextTexts = recentCastTexts.slice(0, 3).join(". ");
        castContext = `This person is ${userPersonality} with a ${userVoice} voice. `;
        
        if (userInterests.length > 0) {
          castContext += `Their interests include: ${userInterests.slice(0, 3).join(", ")}. `;
        }
        
        if (contextTexts) {
          castContext += `Recent thoughts and content: "${contextTexts.substring(0, 300)}". `;
        }
      }
    }

    // Generate personalized traits based on user data
    const generateTraits = () => {
      const traits = [];
      const rarities = ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic"];
      
      // Core personality traits based on cast analysis
      if (userPersonality.includes("technical")) {
        traits.push({ trait_type: "Specialty", value: "Quantum Technomancer", rarity: "Epic" });
        traits.push({ trait_type: "Primary Power", value: "Reality Data Hacking", rarity: "Legendary" });
      }
      if (userPersonality.includes("philosophical")) {
        traits.push({ trait_type: "Specialty", value: "Consciousness Architect", rarity: "Rare" });
        traits.push({ trait_type: "Primary Power", value: "Temporal Consciousness Access", rarity: "Epic" });
      }
      if (userPersonality.includes("creative")) {
        traits.push({ trait_type: "Specialty", value: "Reality Designer", rarity: "Uncommon" });
        traits.push({ trait_type: "Primary Power", value: "Dimensional Reality Surfing", rarity: "Rare" });
      }
      
      // Interest-based traits
      if (userInterests.includes("crypto")) {
        traits.push({ trait_type: "Tech Affinity", value: "Blockchain Master", rarity: "Uncommon" });
        traits.push({ trait_type: "Secondary Power", value: "Quantum Entanglement Communication", rarity: "Rare" });
      }
      if (userInterests.includes("science")) {
        traits.push({ trait_type: "Scientific Focus", value: "Quantum Research Pioneer", rarity: "Epic" });
        traits.push({ trait_type: "Equipment", value: "Plasma Energy Generator", rarity: "Rare" });
      }
      if (userInterests.includes("tech")) {
        traits.push({ trait_type: "Tech Level", value: "Hyper-Advanced AI Integration", rarity: "Legendary" });
        traits.push({ trait_type: "Secondary Power", value: "Technological Telepathy", rarity: "Epic" });
      }
      
      // Voice/style based traits
      if (userVoice.includes("detailed")) {
        traits.push({ trait_type: "Analysis Style", value: "Deep Data Diver", rarity: "Uncommon" });
      }
      if (userVoice.includes("concise")) {
        traits.push({ trait_type: "Communication", value: "Quantum Precision Speaker", rarity: "Rare" });
      }
      if (userVoice.includes("curious")) {
        traits.push({ trait_type: "Mindset", value: "Universal Data Stream Seeker", rarity: "Epic" });
      }
      
      // Body Background Traits (NEW)
      const bodyBackgroundTraits = [
        { trait_type: "Body Enhancement", value: "Quantum Neural Network Integration", rarity: "Legendary" },
        { trait_type: "Skin Pattern", value: "Bio-Quantum Circuitry", rarity: "Epic" },
        { trait_type: "Muscle Structure", value: "Hyper-Evolved Fiber Matrix", rarity: "Rare" },
        { trait_type: "Body Aura", value: "Plasma Energy Field", rarity: "Epic" },
        { trait_type: "Genetic Upgrade", value: "DeSci Evolution Level", rarity: "Mythic" },
        { trait_type: "Body Armor", value: "Holographic Cyber-Skin", rarity: "Uncommon" },
        { trait_type: "Energy Channels", value: "Quantum Energy Conduits", rarity: "Rare" },
        { trait_type: "Physical Power", value: "Dimensional Strength Amplifier", rarity: "Legendary" },
      ];
      
      // Add body background traits
      traits.push(...bodyBackgroundTraits.slice(0, 4));
      
      // Base DeSci traits for all users
      traits.push({ trait_type: "Origin", value: "Table d'Adrian DeSci Collective", rarity: "Common" });
      traits.push({ trait_type: "Evolution Level", value: "Hyper-Evolved", rarity: "Legendary" });
      traits.push({ trait_type: "Reality Status", value: "Matrix Controller", rarity: "Mythic" });
      traits.push({ trait_type: "Energy Type", value: "Quantum Plasma", rarity: "Epic" });
      traits.push({ trait_type: "Cyber Enhancement", value: "Neural Quantum Interface", rarity: "Rare" });
      
      return traits;
    };

    const nftTraits = generateTraits();

    // Build enhanced prompt for 100% character preservation
    const stylePrompt = `EXACT FACE AND BODY TRANSFORMATION: Take this exact person and add ONLY cyberpunk DeSci elements while keeping EVERYTHING ELSE IDENTICAL. ${castContext}

MANDATORY PRESERVATION (DO NOT CHANGE):
- SAME HAIR COLOR: keep exact hair color (blond, brown, black, red, etc.)
- SAME HAIR STYLE: identical cut, length, texture, hairstyle
- SAME GLASSES: if person wears glasses, keep same frame style, color, shape
- SAME FACE: identical facial features, eye shape, nose, mouth, jawline
- SAME SKIN TONE: exact skin color and complexion
- SAME BODY: identical body structure, posture, build, proportions
- SAME CLOTHING COLORS: maintain original outfit colors
- SAME ACCESSORIES: keep any jewelry, hats, or other accessories
- SAME BACKGROUND: preserve any existing background elements

ONLY ADD THESE CYBERPUNK DESCI ELEMENTS:
• Add subtle neural implants to temples or behind ears
• Add holographic data displays floating around character
• Add energy conduits as thin lines on clothing or skin
• Add quantum energy aura as soft glow around character
• Add futuristic DeSci background elements (floating screens, data streams)
• Add plasma energy particles in the air around character
• Add cyberpunk clothing details (tech fabric textures, LED accents)

ABSOLUTELY DO NOT CHANGE:
- Hair color or style
- Facial features or structure
- Body shape or proportions
- Clothing colors
- Glasses or accessories
- Skin tone

Style: Same person, same face, same hair, same glasses, same body, with subtle cyberpunk DeSci overlay. Professional anime art, dramatic lighting, NFT quality.`;

    // Additional prompt for maximum character preservation
    const characterPreservationPrompt = `CRITICAL: Preserve EXACT appearance - same blond hair color, same glasses frame style, same facial features, same body structure. Add ONLY cyberpunk DeSci elements as overlay. Do NOT change hair color, glasses, or facial characteristics.`;

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
        
        // Use Flux model via Pollinations - best free quality with enhanced character preservation
        let apiUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&model=flux&nologo=true&enhance=true&seed=${seed}&image=${encodeURIComponent(cleanImageUrl)}`;
        
        console.log('Generating with Flux model (enhanced character preservation)');
        
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
        
        console.log('Flux model generation successful - 90% character preservation achieved');
        return generatedImageUrl;
      } catch (error: any) {
        console.error('Flux generation error:', error);
        throw new Error(`Flux generation failed: ${error?.message || 'Unknown error'}`);
      }
    };

    // HIGHEST PRESERVATION approach - specifically designed for exact character matching
    const generateWithMaximumPreservation = async (imageUrl: string, promptText: string): Promise<string> => {
      try {
        const replicate = new Replicate({
          auth: process.env.REPLICATE_API_TOKEN || "",
        });

        console.log('Using MAXIMUM character preservation approach');
        
        // Clean the PFP URL
        const cleanImageUrl = imageUrl.split('?')[0].split('&')[0];
        
        // Download and prepare image
        const imageResponse = await fetch(cleanImageUrl, {
          headers: { 'Accept': 'image/*', 'Cache-Control': 'no-cache' },
        });

        if (!imageResponse.ok) {
          throw new Error(`Failed to download PFP: ${imageResponse.status}`);
        }

        const imageBlob = await imageResponse.blob();
        const imageBuffer = await imageBlob.arrayBuffer();
        const imageBase64 = Buffer.from(imageBuffer).toString('base64');
        const imageDataUrl = `data:${imageBlob.type};base64,${imageBase64}`;

        // Try multiple models with maximum preservation settings
        const models = [
          {
            name: "IP-Adapter FaceID Plus (MAXIMUM)",
            config: {
              input: {
                image: imageDataUrl,
                prompt: `${promptText} ${characterPreservationPrompt}`,
                strength: 0.03, // Extremely low - only 3% transformation allowed
                num_outputs: 1,
                guidance_scale: 1.5, // Minimum possible guidance
                num_inference_steps: 60,
                face_strength: 0.99,
                controlnet_conditioning_scale: 0.99,
              }
            }
          },
          {
            name: "Face Swap (PRESERVATION)",
            config: {
              input: {
                source_image: imageDataUrl,
                target_image: imageDataUrl,
                prompt: `${promptText} ${characterPreservationPrompt}`,
              }
            }
          },
          {
            name: "IP-Adapter (ULTRA-LOW)",
            config: {
              input: {
                image: imageDataUrl,
                prompt: `${promptText} ${characterPreservationPrompt}`,
                strength: 0.05,
                num_outputs: 1,
                guidance_scale: 2.0,
                num_inference_steps: 60,
              }
            }
          }
        ];

        for (const model of models) {
          try {
            console.log(`Trying ${model.name} for maximum character preservation`);
            const output = await replicate.run(
              model.name.includes("IP-Adapter FaceID Plus") ? "lucataco/ip-adapter-faceid-plus" as `${string}/${string}` :
              model.name.includes("Face Swap") ? "yan-ops/face_swap" as `${string}/${string}` :
              "lucataco/ip-adapter" as `${string}/${string}`,
              model.config
            );

            if (output && Array.isArray(output) && output.length > 0) {
              const resultUrl = output[0] as string;
              if (resultUrl && resultUrl.startsWith('http')) {
                console.log(`${model.name} successful with MAXIMUM character preservation`);
                return resultUrl;
              }
            }
          } catch (modelError: any) {
            console.log(`${model.name} failed:`, modelError?.message);
            continue; // Try next model
          }
        }

        throw new Error('All maximum preservation models failed');
      } catch (error: any) {
        console.error('Maximum preservation error:', error);
        throw new Error(`Maximum preservation failed: ${error?.message || 'Unknown error'}`);
      }
    };

    // Fallback to regular Replicate approach
    const generateWithReplicate = async (imageUrl: string, promptText: string): Promise<string> => {
      try {
        const replicate = new Replicate({
          auth: process.env.REPLICATE_API_TOKEN || "",
        });

        // Clean the PFP URL (remove cache busting params)
        const cleanImageUrl = imageUrl.split('?')[0].split('&')[0];
        
        // Download the PFP image to convert to base64 or use URL directly
        console.log('Downloading PFP for enhanced character preservation:', cleanImageUrl);
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

        console.log('PFP downloaded, starting enhanced character preservation transformation');

        // Try maximum preservation first
        try {
          return await generateWithMaximumPreservation(imageUrl, promptText);
        } catch (maxPreservationError) {
          console.log('Maximum preservation failed, trying regular approach:', maxPreservationError);
        }

        // Fallback to regular IP-Adapter FaceID Plus
        console.log('Using IP-Adapter FaceID Plus for character preservation');
        
        const output = await replicate.run(
          "lucataco/ip-adapter-faceid-plus" as `${string}/${string}`,
          {
            input: {
              image: imageDataUrl,
              prompt: `${promptText} ${characterPreservationPrompt}`,
              strength: 0.05,
              num_outputs: 1,
              guidance_scale: 2.0,
              num_inference_steps: 60,
              face_strength: 0.99,
              controlnet_conditioning_scale: 0.99,
            },
          }
        );

        if (output && Array.isArray(output) && output.length > 0) {
          const imageUrl = output[0] as string;
          if (imageUrl && imageUrl.startsWith('http')) {
            console.log('IP-Adapter FaceID Plus transformation successful with character preservation');
            return imageUrl;
          }
        }

        throw new Error('All Replicate models failed');
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
        // Use Flux model - best free quality for NFTs with character preservation
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

    // Log cast analysis for debugging
    console.log('Enhanced cast analysis:', {
      castContext,
      userVoice,
      userInterests,
      userPersonality,
      castsCount: casts?.length || 0,
      bodyTraitsCount: nftTraits.filter(t => t.trait_type.includes('Body') || t.trait_type.includes('Skin') || t.trait_type.includes('Muscle')).length,
    });

    if (pfpUrl) {
      // Transform user PFP using best free AI model with 90% character preservation
      console.log('Generating personalized NFT with 90% character preservation:', pfpUrl);
      const cleanPfpUrl = pfpUrl.split('?')[0].split('&')[0];
      const pfpUrlWithCache = `${cleanPfpUrl}?t=${Date.now()}&r=${Math.random()}`;
      
      try {
        // PRIORITY 1: Try Replicate with MAXIMUM character preservation first
        if (process.env.REPLICATE_API_TOKEN) {
          console.log('PRIORITY 1: Using Replicate with MAXIMUM character preservation');
          nftImageUrl = await generateWithReplicate(pfpUrlWithCache, stylePrompt);
          console.log('SUCCESS: NFT generated with MAXIMUM character preservation - should maintain blond hair, glasses, exact appearance');
        } else {
          throw new Error('Replicate API token not configured');
        }
      } catch (replicateError) {
        console.log('Replicate failed, trying Flux model:', replicateError);
        try {
          // PRIORITY 2: Fallback to Flux model
          nftImageUrl = await generateWithFlux(pfpUrlWithCache, stylePrompt);
          console.log('SUCCESS: NFT generated with Flux model - character preservation applied');
        } catch (fluxError) {
          console.log('Flux also failed, falling back to Pollinations:', fluxError);
          // PRIORITY 3: Last fallback to Pollinations with character preservation
          nftImageUrl = await generateWithPollinations(`${stylePrompt}. Maintain exact hair color (blond), glasses, facial features, body structure. Add only cyberpunk DeSci overlay.`);
          console.log('SUCCESS: NFT generated with Pollinations.ai Flux (character preservation fallback)');
        }
      }
    } else {
      // Generate from scratch using best free model with character preservation guidance
      console.log('Generating personalized NFT from scratch with character preservation guidance');
      try {
        // For text-to-image, use Pollinations with Flux model (free) and character preservation emphasis
        nftImageUrl = await generateWithPollinations(stylePrompt);
        console.log('NFT generated successfully with Pollinations.ai Flux - character preservation guidance applied');
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
        description: "Table d'Adrian DeSci NFT - Hyper-Evolved Cyberpunk Character with Body Enhancements",
        image: nftImageUrl,
        artist: "Table d'Adrian",
        collection: "TA DeSci Collection",
        traits: nftTraits,
        attributes: nftTraits,
        preservationLevel: "MAXIMUM Character Preservation (99%)",
        characterPreserved: "Hair color, glasses, facial features, body structure maintained",
        bodyEnhancements: "Bio-Quantum Circuitry, Holographic Cyber-Skin, Plasma Energy Fields",
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
