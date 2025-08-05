import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invokeLLM } from "@/lib/ai";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, storyContext } = await request.json();
    const { id: storyId } = await params;
    const userId = (session.user as any).id || session.user.email;

    // Verify story belongs to user
    const story = await prisma.story.findFirst({
      where: {
        id: storyId,
        userId: userId,
      },
      include: {
        child: true,
        pages: {
          orderBy: { pageNumber: "asc" },
        },
      },
    });

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    console.log(`[HOLISTIC-CHAT] Processing request: "${message}"`);

    // Check if this is a text update request - bypass complex analysis for these
    const messageLower = message.toLowerCase();
    const isTextUpdateRequest = messageLower.includes("update") || 
                               messageLower.includes("text") || 
                               messageLower.includes("match") || 
                               messageLower.includes("visual") ||
                               messageLower.includes("cohesive") ||
                               messageLower.includes("rewrite") ||
                               messageLower.includes("fix") ||
                               messageLower.includes("look at") ||
                               messageLower.includes("holistic") ||
                               messageLower.includes("make") ||
                               messageLower.includes("story") ||
                               messageLower.includes("pages") ||
                               messageLower.includes("pictures");

    console.log(`[HOLISTIC-CHAT] Message: "${message}"`);
    console.log(`[HOLISTIC-CHAT] isTextUpdateRequest: ${isTextUpdateRequest}`);
    console.log(`[HOLISTIC-CHAT] Keyword matches:`, {
      update: messageLower.includes("update"),
      text: messageLower.includes("text"),
      match: messageLower.includes("match"),
      visual: messageLower.includes("visual"),
      cohesive: messageLower.includes("cohesive"),
      rewrite: messageLower.includes("rewrite"),
      fix: messageLower.includes("fix"),
      lookAt: messageLower.includes("look at"),
      holistic: messageLower.includes("holistic"),
      make: messageLower.includes("make"),
      story: messageLower.includes("story"),
      pages: messageLower.includes("pages"),
      pictures: messageLower.includes("pictures")
    });

    if (isTextUpdateRequest) {
      console.log(`[HOLISTIC-CHAT] Text update request detected: "${message}"`);
      console.log(`[HOLISTIC-CHAT] Proceeding with holistic text update...`);
      
      const result = await updateAllPagesText(story, message);
      
      return NextResponse.json({
        response: result.response,
        storyUpdated: result.updated,
      });
    }

    // Analyze what kind of holistic change is needed
    console.log(`[HOLISTIC-CHAT] Running analysis for: "${message}"`);
    const analysisPrompt = `
      You are an AI assistant helping with holistic story changes. Analyze the user's request and determine what type of broad change they want.
      
      STORY CONTEXT:
      - Title: ${story.title}
      - Child: ${story.child.name}, age ${story.child.age}
      - Theme: Overcoming fear of ${story.fearDescription}
      - Current pages: ${story.pages.length}
      
      USER REQUEST: "${message}"
      
      Determine the type of change needed:
      - "length" - Making story longer/shorter, adding/removing pages
      - "tone" - Changing overall mood, excitement level, emotional tone
      - "character" - Adding new characters, changing character traits globally
      - "setting" - Changing where the story takes place
      - "theme" - Adjusting the fear being overcome or story message
      - "age" - Adjusting complexity for different age group
      - "structure" - Reorganizing story flow, pacing, sequence, updating text to match visuals
      - "advice" - Just providing guidance without making changes
      
      Return JSON:
      {
        "changeType": "length|tone|character|setting|theme|age|structure|advice",
        "description": "Brief description of what needs to be changed",
        "requiresChanges": true/false
      }
    `;

    console.log(`[HOLISTIC-CHAT] Calling invokeLLM for analysis...`);
    const analysisResult = await invokeLLM(analysisPrompt);
    console.log(`[HOLISTIC-CHAT] Analysis result:`, { success: analysisResult.success, error: analysisResult.error });
    
    if (!analysisResult.success) {
      console.error(`[HOLISTIC-CHAT] Analysis failed:`, analysisResult.error);
      return NextResponse.json({
        response: `I'm having trouble understanding your request. Could you be more specific about what you'd like to change about the story? (Debug: ${analysisResult.error})`,
        storyUpdated: false,
      });
    }

    let analysis;
    try {
      analysis = typeof analysisResult.data === 'string' 
        ? JSON.parse(analysisResult.data) 
        : analysisResult.data;
    } catch (e) {
      console.error("Failed to parse analysis:", analysisResult.data);
      return NextResponse.json({
        response: "I can help you make changes to your story! Try asking me to adjust the tone, add characters, change settings, or modify the story length.",
        storyUpdated: false,
      });
    }

    console.log(`[HOLISTIC-CHAT] Analysis result:`, analysis);

    // If it's just advice, provide guidance without making changes
    if (!analysis.requiresChanges || analysis.changeType === "advice") {
      const advicePrompt = `
        You are a helpful story editing assistant. The user asked: "${message}"
        
        Provide helpful advice about their story:
        - Title: ${story.title}
        - Child: ${story.child.name}, age ${story.child.age}
        - Theme: Overcoming fear of ${story.fearDescription}
        - Pages: ${story.pages.length}
        
        Give specific, actionable advice about how they could improve their story, but don't make any actual changes.
      `;

      const adviceResult = await invokeLLM(advicePrompt);
      
      return NextResponse.json({
        response: adviceResult.success 
          ? (typeof adviceResult.data === 'string' ? adviceResult.data : JSON.stringify(adviceResult.data))
          : "I'd be happy to help you improve your story! Could you tell me more specifically what you'd like to change?",
        storyUpdated: false,
      });
    }

    // For actual changes, check if the user is asking for immediate action or just exploring
    const wantsImmediateAction = message.toLowerCase().includes("update") || 
                                message.toLowerCase().includes("change") || 
                                message.toLowerCase().includes("fix") ||
                                message.toLowerCase().includes("make") ||
                                message.toLowerCase().includes("rewrite");
    
    if (wantsImmediateAction && analysis.changeType === "structure") {
      // Handle holistic text updates to match visuals
      console.log(`[HOLISTIC-CHAT] Processing holistic text update request`);
      
      const result = await updateAllPagesText(story, message);
      
      return NextResponse.json({
        response: result.response,
        storyUpdated: result.updated,
      });
    } else {
      // Provide detailed explanation and ask for confirmation
      const changePrompt = `
        The user wants to make this holistic change to their story: "${message}"
        
        Change type: ${analysis.changeType}
        Description: ${analysis.description}
        
        STORY CONTEXT:
        - Title: ${story.title}
        - Child: ${story.child.name}, age ${story.child.age}
        - Theme: Overcoming fear of ${story.fearDescription}
        - Current pages: ${story.pages.length}
        - Current page texts: ${story.pages.map((p: any) => `Page ${p.pageNumber}: "${p.text}"`).join('\n')}
        
        Explain what this change would involve and ask for confirmation. Be specific about:
        1. What parts of the story would change
        2. Whether pages would be added/removed/modified
        3. If this affects the core theme or characters
        4. What the user should expect
        
        End with: "Would you like me to proceed with these changes?"
        
        Keep response conversational and helpful.
      `;

      const changeResult = await invokeLLM(changePrompt);
      
      return NextResponse.json({
        response: changeResult.success 
          ? (typeof changeResult.data === 'string' ? changeResult.data : JSON.stringify(changeResult.data))
          : "This sounds like an interesting change! Could you give me a bit more detail about what you'd like to modify?",
        storyUpdated: false,
      });
    }

  } catch (error) {
    console.error("Holistic chat failed:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

async function updateAllPagesText(story: any, instruction: string) {
  console.log(`[HOLISTIC-CHAT] Updating all pages based on: "${instruction}"`);
  
  try {
    // Check if we have user-uploaded images to analyze
    const pagesWithImages = story.pages.filter((p: any) => p.userUploadedImageUrl);
    
    if (pagesWithImages.length > 0) {
      console.log(`[HOLISTIC-CHAT] Found ${pagesWithImages.length} pages with uploaded images, using vision analysis`);
      return await updateAllPagesTextWithVision(story, instruction);
    } else {
      console.log(`[HOLISTIC-CHAT] No uploaded images found, using text-based descriptions`);
    }

    // Create a comprehensive prompt for ChatGPT to rewrite all pages cohesively
    const holisticPrompt = `
You are a professional children's story writer. Rewrite ALL pages of this story to be cohesive and match the visual content.

STORY INFO:
- Title: ${story.title}
- Child: ${story.child.name}, age ${story.child.age}
- Theme: Overcoming fear of ${story.fearDescription}
- Total pages: ${story.pages.length}

USER REQUEST: "${instruction}"

CURRENT PAGES AND THEIR VISUAL CONTENT:
${story.pages.map((p: any) => `
Page ${p.pageNumber}:
- Current text: "${p.text}"
- Visual description: "${p.illustrationPrompt}"
- Characters in scene: ${p.charactersInScene.join(', ')}
`).join('\n')}

TASK: Rewrite ALL page texts to:
1. Match the visual content described in each page's illustration prompt
2. Create a cohesive story flow from page 1 to ${story.pages.length}
3. Maintain the theme of overcoming fear of ${story.fearDescription}
4. Keep ${story.child.name} as the main character
5. Use age-appropriate language for a ${story.child.age}-year-old
6. Each page should be 30-50 words (1-2 sentences)

Return ONLY a JSON object with this exact structure:
{
  "pages": [
    {
      "pageNumber": 1,
      "newText": "Updated text for page 1..."
    },
    {
      "pageNumber": 2, 
      "newText": "Updated text for page 2..."
    }
  ]
}

IMPORTANT: Return ONLY the JSON object, no additional text or explanation.
    `;

    console.log(`[HOLISTIC-CHAT] Sending holistic update prompt to ChatGPT...`);
    const result = await invokeLLM(holisticPrompt);
    
    if (!result.success) {
      console.error(`[HOLISTIC-CHAT] ChatGPT request failed:`, result.error);
      return {
        response: `I had trouble connecting to ChatGPT. Error: ${result.error}. Please try again.`,
        updated: false,
      };
    }

    console.log(`[HOLISTIC-CHAT] ChatGPT response received:`, typeof result.data, result.data);

    // Parse the ChatGPT response
    let pageUpdates;
    try {
      if (typeof result.data === 'string') {
        // Clean up the response in case there's extra text
        let cleanData = result.data.trim();
        
        // Extract JSON if it's wrapped in text
        const jsonMatch = cleanData.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanData = jsonMatch[0];
        }
        
        pageUpdates = JSON.parse(cleanData);
      } else {
        pageUpdates = result.data;
      }
      
      if (!pageUpdates.pages || !Array.isArray(pageUpdates.pages)) {
        throw new Error("Invalid response format - missing pages array");
      }
      
      console.log(`[HOLISTIC-CHAT] Successfully parsed ${pageUpdates.pages.length} page updates`);
      
    } catch (parseError) {
      console.error(`[HOLISTIC-CHAT] Failed to parse ChatGPT response:`, parseError);
      console.error(`[HOLISTIC-CHAT] Raw response:`, result.data);
      return {
        response: "ChatGPT responded, but I had trouble understanding the format. Please try again.",
        updated: false,
      };
    }

    // Update all pages in the database
    let updatedCount = 0;
    await prisma.$transaction(async (tx) => {
      for (const update of pageUpdates.pages) {
        const page = story.pages.find((p: any) => p.pageNumber === update.pageNumber);
        if (page && update.newText) {
          await tx.storyPage.update({
            where: { id: page.id },
            data: { text: update.newText.trim() }
          });
          updatedCount++;
          console.log(`[HOLISTIC-CHAT] Updated page ${update.pageNumber}: "${update.newText}"`);
        }
      }
    });

    console.log(`[HOLISTIC-CHAT] Successfully updated ${updatedCount} pages with ChatGPT content`);
    
    return {
      response: `🎉 I've used ChatGPT to update all ${updatedCount} pages! The story now flows cohesively from beginning to end, with each page matching its visual content. ${story.child.name}'s journey of overcoming their fear of ${story.fearDescription} is now beautifully told across all pages. The page will refresh automatically to show the changes.`,
      updated: true,
    };

  } catch (error) {
    console.error(`[HOLISTIC-CHAT] Error updating pages:`, error);
    return {
      response: `Sorry, I encountered an error while updating the story: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
      updated: false,
    };
  }
}

async function updateAllPagesTextWithVision(story: any, instruction: string) {
  console.log(`[HOLISTIC-CHAT] Using ChatGPT Vision to analyze uploaded images...`);
  
  try {
    // First, analyze each uploaded image with ChatGPT Vision
    const imageAnalyses = [];
    
    for (const page of story.pages) {
      if (page.userUploadedImageUrl) {
        console.log(`[HOLISTIC-CHAT] Analyzing image for page ${page.pageNumber}...`);
        
        try {
          // Use OpenAI Vision API directly
          const response = await fetch("/api/openai-vision", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageData: page.userUploadedImageUrl,
              prompt: `Analyze this image for a children's story page. Describe:
1. What is happening in the scene?
2. What emotions or actions are shown?
3. What objects, settings, or environments are visible?
4. How does this relate to a story about a child overcoming fears?

Be specific and detailed - this will be used to write story text that matches the image exactly.`
            })
          });
          
          if (response.ok) {
            const visionResult = await response.json();
            imageAnalyses.push({
              pageNumber: page.pageNumber,
              analysis: visionResult.data?.description || visionResult.result || "Could not analyze image",
              currentText: page.text
            });
            console.log(`[HOLISTIC-CHAT] Page ${page.pageNumber} analysis: ${visionResult.data?.description?.substring(0, 100)}...`);
          } else {
            console.error(`[HOLISTIC-CHAT] Vision analysis failed for page ${page.pageNumber}`);
            imageAnalyses.push({
              pageNumber: page.pageNumber,
              analysis: "Image analysis unavailable",
              currentText: page.text
            });
          }
        } catch (error) {
          console.error(`[HOLISTIC-CHAT] Error analyzing page ${page.pageNumber}:`, error);
          imageAnalyses.push({
            pageNumber: page.pageNumber,
            analysis: "Image analysis failed",
            currentText: page.text
          });
        }
      } else {
        // No uploaded image, use original illustration prompt
        imageAnalyses.push({
          pageNumber: page.pageNumber,
          analysis: page.illustrationPrompt || "No visual description available",
          currentText: page.text
        });
      }
    }
    
    // Now create a comprehensive prompt with the actual image analyses
    const visionPrompt = `
You are a professional children's story writer. I have analyzed the actual images in this children's book using AI vision. Now rewrite ALL pages to match what's actually shown in the images.

STORY INFO:
- Title: ${story.title}
- Child: ${story.child.name}, age ${story.child.age}
- Theme: Overcoming fear of ${story.fearDescription}
- Total pages: ${story.pages.length}

USER REQUEST: "${instruction}"

ACTUAL IMAGE ANALYSES (what ChatGPT Vision saw in each image):
${imageAnalyses.map(analysis => `
Page ${analysis.pageNumber}:
- Current text: "${analysis.currentText}"
- ACTUAL IMAGE CONTENT: "${analysis.analysis}"
`).join('\n')}

TASK: Rewrite ALL page texts to:
1. Match exactly what is shown in the actual images (use the ACTUAL IMAGE CONTENT descriptions)
2. Create a cohesive story flow from page 1 to ${story.pages.length}
3. Maintain the theme of overcoming fear of ${story.fearDescription}
4. Keep ${story.child.name} as the main character
5. Use age-appropriate language for a ${story.child.age}-year-old
6. Each page should be 30-50 words (1-2 sentences)
7. Make sure the text describes what is actually happening in each image

Return ONLY a JSON object with this exact structure:
{
  "pages": [
    {
      "pageNumber": 1,
      "newText": "Text that matches what's actually in the image..."
    },
    {
      "pageNumber": 2,
      "newText": "Text that matches what's actually in the image..."
    }
  ]
}

IMPORTANT: Base the story text on the ACTUAL IMAGE CONTENT, not the old text or descriptions. Return ONLY the JSON object.
    `;

    console.log(`[HOLISTIC-CHAT] Sending vision-based prompt to ChatGPT...`);
    const result = await invokeLLM(visionPrompt);
    
    if (!result.success) {
      console.error(`[HOLISTIC-CHAT] ChatGPT vision request failed:`, result.error);
      return {
        response: `I had trouble connecting to ChatGPT for vision analysis. Error: ${result.error}. Please try again.`,
        updated: false,
      };
    }

    console.log(`[HOLISTIC-CHAT] ChatGPT vision response received:`, typeof result.data);

    // Parse the ChatGPT response
    let pageUpdates;
    try {
      if (typeof result.data === 'string') {
        let cleanData = result.data.trim();
        const jsonMatch = cleanData.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanData = jsonMatch[0];
        }
        pageUpdates = JSON.parse(cleanData);
      } else {
        pageUpdates = result.data;
      }
      
      if (!pageUpdates.pages || !Array.isArray(pageUpdates.pages)) {
        throw new Error("Invalid response format - missing pages array");
      }
      
      console.log(`[HOLISTIC-CHAT] Successfully parsed ${pageUpdates.pages.length} vision-based page updates`);
      
    } catch (parseError) {
      console.error(`[HOLISTIC-CHAT] Failed to parse ChatGPT vision response:`, parseError);
      console.error(`[HOLISTIC-CHAT] Raw response:`, result.data);
      return {
        response: "ChatGPT analyzed the images, but I had trouble understanding the response format. Please try again.",
        updated: false,
      };
    }

    // Update all pages in the database
    let updatedCount = 0;
    await prisma.$transaction(async (tx) => {
      for (const update of pageUpdates.pages) {
        const page = story.pages.find((p: any) => p.pageNumber === update.pageNumber);
        if (page && update.newText) {
          await tx.storyPage.update({
            where: { id: page.id },
            data: { text: update.newText.trim() }
          });
          updatedCount++;
          console.log(`[HOLISTIC-CHAT] Updated page ${update.pageNumber} with vision-based text: "${update.newText}"`);
        }
      }
    });

    console.log(`[HOLISTIC-CHAT] Successfully updated ${updatedCount} pages with vision-analyzed content`);
    
    return {
      response: `🔍📖 Amazing! I used ChatGPT Vision to analyze your actual uploaded images and rewrote all ${updatedCount} pages to match exactly what's shown in the pictures! The story now describes what's really happening in each image, creating a cohesive narrative that perfectly matches your visuals. The page will refresh automatically to show the changes.`,
      updated: true,
    };

  } catch (error) {
    console.error(`[HOLISTIC-CHAT] Error in vision-based update:`, error);
    return {
      response: `Sorry, I encountered an error while analyzing the images: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
      updated: false,
    };
  }
}