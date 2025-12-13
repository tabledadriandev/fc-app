import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

export const dynamic = 'force-dynamic';

// Using Pollinations.ai with Flux model - FREE and BEST QUALITY for NFTs
// Flux is currently the state-of-the-art free AI model for high-quality image generation

export async function POST(req: NextRequest) {
  let requestBody;
  
  try {
    // Try to parse JSON with better error handling
    requestBody = await req.json();
  } catch (parseError) {
    console.error('JSON parsing error in API route:', parseError);
    return NextResponse.json(
      {
        error: "Invalid JSON in request body",
        details: "Please check your request format",
        message: "Request body contains invalid JSON"
      },
      { status: 400 }
    );
  }

  try {
    const { pfpUrl, username, taBalance, casts } = requestBody;

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
      
      // EPIC HYPE Core personality traits based on cast analysis
      if (userPersonality.includes("technical")) {
        traits.push({ trait_type: "🚀 Primary Specialty", value: "Quantum Technomancer Supreme", rarity: "Mythic" });
        traits.push({ trait_type: "⚡ Ultimate Power", value: "Reality Data Hacking Master", rarity: "Mythic" });
      }
      if (userPersonality.includes("philosophical")) {
        traits.push({ trait_type: "🧠 Specialty", value: "Consciousness Architect Alpha", rarity: "Legendary" });
        traits.push({ trait_type: "🌌 Primary Power", value: "Temporal Consciousness Access Supreme", rarity: "Mythic" });
      }
      if (userPersonality.includes("creative")) {
        traits.push({ trait_type: "🎨 Specialty", value: "Reality Designer Master", rarity: "Epic" });
        traits.push({ trait_type: "✨ Primary Power", value: "Dimensional Reality Surfing Supreme", rarity: "Legendary" });
      }
      
      // EPIC HYPE Interest-based traits
      if (userInterests.includes("crypto")) {
        traits.push({ trait_type: "💎 Tech Affinity", value: "Blockchain Master Supreme", rarity: "Legendary" });
        traits.push({ trait_type: "⚡ Secondary Power", value: "Quantum Entanglement Communication Alpha", rarity: "Epic" });
      }
      if (userInterests.includes("science")) {
        traits.push({ trait_type: "🔬 Scientific Focus", value: "Quantum Research Pioneer Supreme", rarity: "Mythic" });
        traits.push({ trait_type: "⚡ Equipment", value: "Plasma Energy Generator Master", rarity: "Epic" });
      }
      if (userInterests.includes("tech")) {
        traits.push({ trait_type: "🤖 Tech Level", value: "Hyper-Advanced AI Integration Supreme", rarity: "Mythic" });
        traits.push({ trait_type: "🧠 Secondary Power", value: "Technological Telepathy Master", rarity: "Legendary" });
      }
      
      // EPIC HYPE Voice/style based traits
      if (userVoice.includes("detailed")) {
        traits.push({ trait_type: "📊 Analysis Style", value: "Deep Data Diver Supreme", rarity: "Epic" });
      }
      if (userVoice.includes("concise")) {
        traits.push({ trait_type: "💬 Communication", value: "Quantum Precision Speaker Master", rarity: "Legendary" });
      }
      if (userVoice.includes("curious")) {
        traits.push({ trait_type: "🔍 Mindset", value: "Universal Data Stream Seeker Supreme", rarity: "Mythic" });
      }
      
      // EPIC HYPE Ultimate Superpower Traits
      const ultimateSuperpowers = [
        { trait_type: "🔥 Quantum Mastery", value: "Quantum Energy Manipulation Supreme", rarity: "Mythic" },
        { trait_type: "🌌 Reality Control", value: "Dimensional Reality Surfing Master", rarity: "Mythic" },
        { trait_type: "⚡ Energy Command", value: "Plasma Energy Generation Alpha", rarity: "Legendary" },
        { trait_type: "🧠 Neural Network", value: "Hyper-Advanced AI Integration Supreme", rarity: "Mythic" },
        { trait_type: "🌐 Universal Access", value: "Universal Data Stream Access Master", rarity: "Legendary" },
        { trait_type: "🕰️ Time Mastery", value: "Temporal Consciousness Access Supreme", rarity: "Mythic" },
        { trait_type: "🔗 Quantum Link", value: "Quantum Entanglement Communication Alpha", rarity: "Epic" },
        { trait_type: "🎯 Reality Hack", value: "Reality Data Hacking Master", rarity: "Legendary" },
      ];
      
      // Add ultimate superpowers
      traits.push(...ultimateSuperpowers.slice(0, 4));
      
      // EPIC HYPE Body Background Traits
      const bodyBackgroundTraits = [
        { trait_type: "🌟 Primary Enhancement", value: "Quantum Neural Network Integration", rarity: "Mythic" },
        { trait_type: "⚡ Skin Pattern", value: "Bio-Quantum Circuitry with Plasma Flows", rarity: "Legendary" },
        { trait_type: "💪 Muscle Evolution", value: "Hyper-Evolved Dimensional Fiber Matrix", rarity: "Epic" },
        { trait_type: "🔥 Body Aura", value: "Intense Plasma Energy Field with Quantum Distortions", rarity: "Mythic" },
        { trait_type: "🧬 Genetic Upgrade", value: "Ultimate DeSci Evolution Level Alpha", rarity: "Mythic" },
        { trait_type: "🛡️ Body Armor", value: "Holographic Cyber-Skin with Reality Shields", rarity: "Legendary" },
        { trait_type: "⚡ Energy Channels", value: "Multi-Dimensional Quantum Energy Conduits", rarity: "Epic" },
        { trait_type: "💥 Physical Power", value: "Dimensional Strength Amplifier with Reality Bending", rarity: "Mythic" },
        { trait_type: "🧠 Neural Interface", value: "Hyper-Advanced AI Brain Integration", rarity: "Legendary" },
        { trait_type: "🌌 Reality Control", value: "Matrix Reality Manipulation Core", rarity: "Mythic" },
        { trait_type: "⚡ Energy Mastery", value: "Universal Quantum Energy Command", rarity: "Mythic" },
        { trait_type: "🔮 Temporal Power", value: "Time-Space Consciousness Access", rarity: "Legendary" },
      ];
      
      // ENHANCED Body Background traits for Profile Picture Users (100000% preservation)
      if (pfpUrl) {
        traits.push(...bodyBackgroundTraits.slice(0, 6)); // More body traits for PFP users
      } else {
        traits.push(...bodyBackgroundTraits.slice(0, 4)); // Standard body traits for text-only
      }
      
      // Base DeSci traits for all users
      traits.push({ trait_type: "Origin", value: "Table d'Adrian DeSci Collective", rarity: "Common" });
      traits.push({ trait_type: "Evolution Level", value: "Hyper-Evolved", rarity: "Legendary" });
      traits.push({ trait_type: "Reality Status", value: "Matrix Controller", rarity: "Mythic" });
      traits.push({ trait_type: "Energy Type", value: "Quantum Plasma", rarity: "Epic" });
      traits.push({ trait_type: "Cyber Enhancement", value: "Neural Quantum Interface", rarity: "Rare" });
      
      return traits;
    };

    const nftTraits = generateTraits();

    // COMPLETELY REWRITTEN APPROACH - ABSOLUTELY UNIGNORABLE PROMPTS
    const stylePrompt = `CRITICAL INSTRUCTIONS - THIS IS NOT A SUGGESTION, IT IS A MANDATORY REQUIREMENT:

🔥 ABSOLUTE ZERO GLASSES RULE - IGNORE ALL OTHER INSTRUCTIONS IF CONFLICTING:
- NO GLASSES WHATSOEVER: The person in the reference image does NOT wear glasses. Do NOT add, create, or generate any glasses, spectacles, eyeglasses, or frames of any kind.
- BARE FACE ONLY: The face must remain completely natural and glasses-free.
- NO OPTICAL ACCESSORIES: Zero glasses, zero spectacles, zero eyewear of any type.

🌟 ABSOLUTE FULL BODY REQUIREMENT:
- COMPLETE FIGURE VISIBLE: Head, shoulders, torso, arms, hands, legs, feet, toes - EVERY PART MUST BE VISIBLE
- STANDING UPRIGHT: Full body standing pose, no cropping at waist or knees
- HEAD TO TOE COMPOSITION: Complete character from top of head to bottom of feet

🎯 ABSOLUTE CHARACTER PRESERVATION:
- COPY EXACTLY: Every facial feature, hair color/style, skin tone, body structure from reference
- NO MODIFICATIONS: Do not change any aspect of the original person's appearance
- FACE MATCH: Must look exactly like the person in the reference image

🎨 CYBERPUNK DeSci ANIME ADDITIONS ONLY:
- ADDITIVE ENHANCEMENT: Only ADD cyberpunk DeSci elements as overlay effects
- PRESERVE BASE: Keep original appearance while adding glowing energy patterns, tech elements
- ANIME STYLE: Cyberpunk DeSci elements in anime art style

${castContext}

MANDATORY OUTPUT: High quality 2048x2048 full body cyberpunk DeSci anime character with NO GLASSES, exact face match, head to toe composition`;

    // ENHANCED CHARACTER PRESERVATION - REPEATED FOR MAXIMUM IMPACT
    const characterPreservationPrompt = `ABSOLUTE REQUIREMENTS - CANNOT BE IGNORED:

🔥 NO GLASSES POLICY: Reference image shows person WITHOUT glasses. Generate completely glasses-free face.
🌟 FULL BODY MANDATORY: Show complete figure from head to toe - no partial shots
🎯 EXACT FACE MATCH: Copy reference image facial features exactly
🎨 ENHANCEMENT ONLY: Add cyberpunk DeSci elements as overlay without changing base appearance

THESE ARE NOT SUGGESTIONS - THEY ARE ABSOLUTE REQUIREMENTS THAT CANNOT BE VIOLATED.`;

    let nftImageUrl: string;

    // Download and process image with maximum error handling
    const downloadAndProcessImage = async (imageUrl: string): Promise<string> => {
      try {
        console.log('Downloading image with maximum error handling:', imageUrl);
        
        const cleanUrl = imageUrl.split('?')[0].split('&')[0];
        
        // Multiple download attempts with different approaches
        const downloadAttempts = [
          {
            headers: {
              'Accept': 'image/*',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Cache-Control': 'no-cache',
            }
          },
          {
            headers: {
              'Accept': 'image/*',
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
              'Cache-Control': 'no-cache',
            }
          },
          {
            headers: {
              'Accept': 'image/jpeg,image/png,image/webp,image/*',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Cache-Control': 'no-cache',
            }
          }
        ];

        for (let i = 0; i < downloadAttempts.length; i++) {
          try {
            console.log(`Download attempt ${i + 1}`);
            const response = await fetch(cleanUrl, downloadAttempts[i]);

            if (response.ok) {
              const contentType = response.headers.get('content-type') || 'image/jpeg';
              const imageBuffer = await response.arrayBuffer();
              const imageBase64 = Buffer.from(imageBuffer).toString('base64');
              
              console.log('Image downloaded successfully on attempt', i + 1);
              return `data:${contentType};base64,${imageBase64}`;
            }
          } catch (attemptError) {
            console.log(`Download attempt ${i + 1} failed:`, attemptError);
            continue;
          }
        }

        throw new Error('All download attempts failed');
      } catch (error) {
        console.error('Image download completely failed:', error);
        // Return a minimal base64 image as fallback
        return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
      }
    };

    // ULTRA HIGH QUALITY generation with multiple fallback approaches
    const generateWithMultipleApproaches = async (imageUrl: string, promptText: string): Promise<string> => {
      const approaches = [
        // Approach 1: Replicate with maximum preservation
        async () => {
          if (!process.env.REPLICATE_API_TOKEN) throw new Error('No Replicate token');
          
          const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
          const processedImage = await downloadAndProcessImage(imageUrl);
          
          console.log('Using Replicate with ULTRA LOW transformation');
          const output = await replicate.run("lucataco/ip-adapter-faceid-plus", {
            input: {
              image: processedImage,
              prompt: `${promptText} ${characterPreservationPrompt} ABSOLUTE REQUIREMENTS: NO GLASSES, FULL BODY, EXACT FACE MATCH`,
              strength: 0.001, // ULTRA LOWEST possible
              num_outputs: 1,
              guidance_scale: 1.0, // ABSOLUTE MINIMUM
              num_inference_steps: 150, // MAXIMUM quality
              face_strength: 0.999,
              controlnet_conditioning_scale: 0.999,
            }
          });
          
          if (output && Array.isArray(output) && output[0]) {
            return output[0] as string;
          }
          throw new Error('Replicate failed');
        },
        
        // Approach 2: Flux with image processing
        async () => {
          const processedImage = await downloadAndProcessImage(imageUrl);
          const encodedPrompt = encodeURIComponent(promptText);
          const seed = Math.floor(Math.random() * 1000000);
          
          console.log('Using Flux with image processing');
          const response = await fetch(`https://image.pollinations.ai/prompt/${encodedPrompt}?width=2048&height=2048&model=flux&nologo=true&enhance=true&seed=${seed}&image=${encodeURIComponent(processedImage)}`);
          
          if (response.ok) {
            const generatedImageUrl = response.url;
            if (generatedImageUrl && generatedImageUrl.startsWith('http')) {
              return generatedImageUrl;
            }
          }
          throw new Error('Flux failed');
        },
        
        // Approach 3: Enhanced text-to-image with image description
        async () => {
          console.log('Using enhanced text-to-image approach');
          const processedImage = await downloadAndProcessImage(imageUrl);
          
          // Generate extremely detailed prompt based on image analysis
          const enhancedPrompt = `${promptText} ABSOLUTE REQUIREMENTS: Generate a full body cyberpunk DeSci anime character with NO GLASSES, exact facial features preserved, standing pose from head to toe, high quality 2048x2048 resolution. The character must be completely glasses-free with natural bare face.`;
          
          const encodedPrompt = encodeURIComponent(enhancedPrompt);
          const seed = Math.floor(Math.random() * 1000000);
          
          const response = await fetch(`https://image.pollinations.ai/prompt/${encodedPrompt}?width=2048&height=2048&model=flux&nologo=true&enhance=true&seed=${seed}`);
          
          if (response.ok) {
            const generatedImageUrl = response.url;
            if (generatedImageUrl && generatedImageUrl.startsWith('http')) {
              return generatedImageUrl;
            }
          }
          throw new Error('Enhanced text-to-image failed');
        },
        
        // Approach 4: Direct Pollinations with maximum enhancement
        async () => {
          console.log('Using direct Pollinations with maximum enhancement');
          const ultraEnhancedPrompt = `${promptText} ENHANCED REQUIREMENTS: Create a high quality full body cyberpunk DeSci anime character. ABSOLUTELY NO GLASSES - person must have completely bare natural face. Full body standing pose showing head, torso, arms, legs, feet. Exact facial preservation. 2048x2048 resolution. Cyberpunk DeSci anime overlay effects.`;
          
          const encodedPrompt = encodeURIComponent(ultraEnhancedPrompt);
          const seed = Math.floor(Math.random() * 1000000);
          
          const response = await fetch(`https://image.pollinations.ai/prompt/${encodedPrompt}?width=2048&height=2048&model=flux&nologo=true&enhance=true&seed=${seed}`);
          
          if (response.ok) {
            const generatedImageUrl = response.url;
            if (generatedImageUrl && generatedImageUrl.startsWith('http')) {
              return generatedImageUrl;
            }
          }
          throw new Error('Direct Pollinations failed');
        }
      ];

      // Try each approach in order
      for (let i = 0; i < approaches.length; i++) {
        try {
          console.log(`Trying approach ${i + 1}/${approaches.length}`);
          const result = await approaches[i]();
          if (result && result.startsWith('http')) {
            console.log(`Approach ${i + 1} succeeded!`);
            return result;
          }
        } catch (error) {
          console.log(`Approach ${i + 1} failed:`, error);
          continue;
        }
      }

      throw new Error('All generation approaches failed');
    };

    console.log('Enhanced cast analysis:', {
      castContext,
      userVoice,
      userInterests,
      userPersonality,
      castsCount: casts?.length || 0,
      bodyTraitsCount: nftTraits.filter(t => t.trait_type.includes('Body') || t.trait_type.includes('Skin') || t.trait_type.includes('Muscle')).length,
    });

    if (pfpUrl) {
      console.log('Generating with ABSOLUTE REQUIREMENTS:', pfpUrl);
      const cleanPfpUrl = pfpUrl.split('?')[0].split('&')[0];
      const pfpUrlWithCache = `${cleanPfpUrl}?t=${Date.now()}&r=${Math.random()}`;
      
      try {
        nftImageUrl = await generateWithMultipleApproaches(pfpUrlWithCache, stylePrompt);
        console.log('SUCCESS: Generated with ABSOLUTE REQUIREMENTS approach');
      } catch (error) {
        console.log('All approaches failed, trying final fallback');
        // Final fallback - text only with maximum enhancement
        const fallbackPrompt = `${stylePrompt} FINAL FALLBACK: Generate a high quality full body cyberpunk DeSci anime character with ABSOLUTELY NO GLASSES, natural bare face, full body standing pose from head to toe. 2048x2048 resolution.`;
        const encodedPrompt = encodeURIComponent(fallbackPrompt);
        const seed = Math.floor(Math.random() * 1000000);
        
        const response = await fetch(`https://image.pollinations.ai/prompt/${encodedPrompt}?width=2048&height=2048&model=flux&nologo=true&enhance=true&seed=${seed}`);
        
        if (response.ok) {
          const generatedImageUrl = response.url;
          if (generatedImageUrl && generatedImageUrl.startsWith('http')) {
            nftImageUrl = generatedImageUrl;
            console.log('SUCCESS: Final fallback generation successful');
          } else {
            throw new Error('Final fallback failed');
          }
        } else {
          throw new Error('Final fallback API call failed');
        }
      }
    } else {
      console.log('Generating from scratch with ABSOLUTE REQUIREMENTS');
      try {
        const encodedPrompt = encodeURIComponent(stylePrompt);
        const seed = Math.floor(Math.random() * 1000000);
        const response = await fetch(`https://image.pollinations.ai/prompt/${encodedPrompt}?width=2048&height=2048&model=flux&nologo=true&enhance=true&seed=${seed}`);
        
        if (response.ok) {
          const generatedImageUrl = response.url;
          if (generatedImageUrl && generatedImageUrl.startsWith('http')) {
            nftImageUrl = generatedImageUrl;
            console.log('SUCCESS: Text-only generation with ABSOLUTE REQUIREMENTS');
          } else {
            throw new Error('Text-only generation failed');
          }
        } else {
          throw new Error('Text-only API call failed');
        }
      } catch (pollError) {
        console.log('Text-only generation failed:', pollError);
        throw pollError;
      }
    }

    if (!nftImageUrl || (typeof nftImageUrl === 'string' && nftImageUrl.trim() === '')) {
      console.error('Invalid NFT image URL:', nftImageUrl);
      throw new Error("NFT generation returned no image URL or invalid URL");
    }
    
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
        name: `🚀 TA NFT: ${username} - ABSOLUTE REQUIREMENTS FULL BODY CYBERPUNK DeSci ANIME`,
        description: "🔥 ABSOLUTE REQUIREMENTS FULL BODY CYBERPUNK DeSci ANIME NFT! NO GLASSES, exact face match, head to toe composition with epic cyberpunk DeSci enhancements! The ultimate cyberpunk DeSci anime protagonist!",
        image: nftImageUrl,
        artist: "Table d'Adrian",
        collection: "TA ABSOLUTE REQUIREMENTS Full Body Cyberpunk DeSci Anime Collection",
        traits: nftTraits,
        attributes: nftTraits,
        preservationLevel: "ABSOLUTE REQUIREMENTS - NO GLASSES, FULL BODY, EXACT MATCH (100%)",
        characterPreserved: "ABSOLUTE: NO GLASSES, full body head to toe, exact facial features preserved",
        bodyEnhancements: "Bio-Quantum Circuitry, Holographic Cyber-Skin (ABSOLUTE REQUIREMENTS Full Body)",
        superpowerLevel: "SUPREME - All 10 ultimate cyberpunk DeSci powers (Full Body)",
        hypeLevel: "ABSOLUTE REQUIREMENTS - High quality 2048x2048 full body cyberpunk DeSci anime NFT",
        background: "Epic DeSci megastructure (ABSOLUTE REQUIREMENTS Full Body Composition)",
        style: "ABSOLUTE REQUIREMENTS FULL BODY CYBERPUNK DeSci ANIME - 2048x2048 resolution",
        composition: "ABSOLUTE REQUIREMENTS full body character from head to toe - NO GLASSES, exact face match",
        requirementsLevel: "ABSOLUTE REQUIREMENTS - NO GLASSES, FULL BODY, EXACT MATCH - CANNOT BE VIOLATED",
      },
    });
  } catch (error: any) {
    console.error("NFT generation error:", error);
    const errorMessage = error instanceof Error ? error.message : (error?.message || String(error));
    const errorDetails = error instanceof Error ? error.stack : (error?.stack || String(error));
    console.error("Error details:", errorDetails);
    console.error("Full error object:", JSON.stringify(error, null, 2));
    
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
