import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invokeLLM, generateImage, generateIllustrationPrompt } from "@/lib/ai";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, pageNumber, conversationHistory, forceUpdateType } = await request.json();
    const { id } = await params;
    const userId = (session.user as any).id || session.user.email;

    console.log(`[CHAT] Processing request for user: ${userId}, story: ${id}`);

    // Verify story belongs to user
    const story = await prisma.story.findFirst({
      where: {
        id,
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

    const currentPage = story.pages.find(p => p.pageNumber === pageNumber);
    if (!currentPage) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Use forced update type if provided, otherwise analyze intent
    let intent;
    if (forceUpdateType) {
      console.log(`[CHAT] Forcing update type: ${forceUpdateType}`);
      intent = {
        success: true,
        data: {
          updateType: forceUpdateType,
          instruction: message,
          scope: "current_page"
        }
      };
    } else {
      intent = await analyzeUserIntent(message, currentPage, story);
      if (!intent.success) {
        return NextResponse.json({
          response: "I'm having trouble understanding your request. Could you please be more specific?",
          storyUpdated: false,
        });
      }
    }

    let response = "";
    let storyUpdated = false;

    if (intent.data.updateType === "text") {
      const result = await updateStoryText(story, currentPage, intent.data.instruction);
      response = result.response;
      storyUpdated = result.updated;
    } else if (intent.data.updateType === "image") {
      const result = await updateStoryImage(story, currentPage, intent.data.instruction);
      response = result.response;
      storyUpdated = result.updated;
    } else if (intent.data.updateType === "both") {
      const textResult = await updateStoryText(story, currentPage, intent.data.textInstruction);
      const imageResult = await updateStoryImage(story, currentPage, intent.data.imageInstruction);
      response = `${textResult.response} ${imageResult.response}`;
      storyUpdated = textResult.updated || imageResult.updated;
    } else if (intent.data.updateType === "global") {
      const result = await updateGlobalCharacteristic(story, intent.data.instruction);
      response = result.response;
      storyUpdated = result.updated;
    } else {
      response = "I can help you edit the story text, update illustrations, or change character details. What would you like me to modify?";
    }

    console.log(`[CHAT] Final response:`, { response: response.substring(0, 100) + "...", storyUpdated });
    
    return NextResponse.json({
      response,
      storyUpdated,
    });
  } catch (error) {
    console.error("Chat processing failed:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}

async function analyzeUserIntent(message: string, currentPage: any, story: any) {
  const prompt = `
    You are an AI assistant helping to edit a children's story. Analyze the user's message and determine what they want to change.
    
    CURRENT PAGE INFO:
    - Text: "${currentPage.text}"
    - Illustration description: "${currentPage.illustrationPrompt}"
    - Character: ${story.child.name} (${story.child.appearanceDescription})
    - Story theme: Overcoming fear of ${story.fearDescription}
    
    USER MESSAGE: "${message}"
    
    INSTRUCTIONS:
    - DEFAULT to "text" unless explicitly about images or visual styles
    - Use "image" if they mention: picture, image, illustration, visual, drawing, art, colors, scene visuals, style changes
    - Use "text" for: story changes, making things exciting/scary/happy, character actions, dialogue, plot changes, emotions
    - Use "both" only if they explicitly want both text AND image changes
    - Use "global" only for permanent character appearance changes (hair, height, clothing style)
    - Use "unclear" only if completely unrelated to story editing
    
    STYLE CHANGE DETECTION:
    - Art style mentions (cartoon, realistic, watercolor, sketch, digital art, anime) → image
    - Color scheme changes (bright, dark, pastel, vibrant, monochrome) → image  
    - Visual mood changes affecting appearance (dreamy, magical, scary visuals) → image
    
    EXAMPLES:
    - "Make it more exciting" → text
    - "Make the character happy" → text  
    - "Add some action" → text
    - "Change the story" → text
    - "Make it scarier" → text
    - "Add a rainbow to the picture" → image
    - "Change the illustration" → image
    - "Update the drawing" → image
    - "Make it cartoon style" → image
    - "Use watercolor style" → image
    - "Make the colors more vibrant" → image
    - "Make text more exciting and add rainbow to image" → both
    - "Change character hair color permanently" → global
    
    Return ONLY valid JSON:
    {
      "updateType": "text|image|both|global|unclear",
      "instruction": "detailed instruction for single updates",
      "textInstruction": "instruction for text changes (for both)",
      "imageInstruction": "instruction for image changes (for both)",
      "scope": "current_page|all_pages"
    }
  `;

  console.log(`[CHAT] Analyzing user intent: "${message}"`);
  const result = await invokeLLM(prompt);
  
  if (result.success) {
    try {
      let parsed;
      if (typeof result.data === 'string') {
        parsed = JSON.parse(result.data);
      } else {
        parsed = result.data;
      }
      
      console.log(`[CHAT] Intent analysis result:`, parsed);
      return { success: true, data: parsed };
    } catch (e) {
      console.error(`[CHAT] Failed to parse intent:`, e);
      console.error(`[CHAT] Raw data:`, result.data);
      
      // Fallback: improved detection for image and style changes
      const msg = message.toLowerCase();
      const imageKeywords = ['picture', 'image', 'illustration', 'visual', 'drawing', 'art'];
      const styleKeywords = ['style', 'cartoon', 'realistic', 'watercolor', 'sketch', 'digital', 'anime', 'bright', 'dark', 'pastel', 'vibrant', 'monochrome', 'colorful'];
      
      const hasImageKeywords = imageKeywords.some(keyword => msg.includes(keyword));
      const hasStyleKeywords = styleKeywords.some(keyword => msg.includes(keyword));
      
      if (hasImageKeywords || hasStyleKeywords) {
        console.log(`[CHAT] Fallback detected image/style change for: "${message}"`);
        return { 
          success: true, 
          data: { updateType: 'image', instruction: message, scope: 'current_page' }
        };
      } else {
        // Default to text editing for everything else
        console.log(`[CHAT] Defaulting to text editing for: "${message}"`);
        return { 
          success: true, 
          data: { updateType: 'text', instruction: message, scope: 'current_page' }
        };
      }
    }
  }
  
  console.error(`[CHAT] Intent analysis failed:`, result.error);
  return { success: false, error: result.error };
}

async function updateStoryText(story: any, currentPage: any, instruction: string) {
  // Check if user wants to set exact text
  const exactTextMatch = instruction.match(/^change the text to:\s*(.*)/i);
  
  if (exactTextMatch) {
    // User provided exact text - use it directly
    const newText = exactTextMatch[1].trim();
    console.log(`[CHAT] Using exact text replacement: "${newText}"`);
    
    if (!newText) {
      return {
        response: "Please provide the exact text you want to use after 'Change the text to:'",
        updated: false,
      };
    }
    
    try {
      const updatedPage = await prisma.storyPage.update({
        where: { id: currentPage.id },
        data: { text: newText },
      });
      
      console.log(`[CHAT] Successfully updated page ${currentPage.pageNumber} with exact text`);
      console.log(`[CHAT] Database now contains: "${updatedPage.text}"`);
      
      return {
        response: `I've updated the page text to exactly what you specified: "${newText}"`,
        updated: true,
      };
    } catch (error) {
      console.error(`[CHAT] Database update failed:`, error);
      return {
        response: "Sorry, I couldn't save the text update right now.",
        updated: false,
      };
    }
  }

  // Otherwise, use AI to modify the text based on instructions
  const prompt = `
    You are helping edit a children's story. Update the page text based on the user's request.
    
    CURRENT TEXT: "${currentPage.text}"
    CHARACTER: ${story.child.name}, age ${story.child.age}
    STORY THEME: Overcoming fear of ${story.fearDescription}
    
    USER REQUEST: "${instruction}"
    
    REQUIREMENTS:
    - Keep it age-appropriate for a ${story.child.age}-year-old
    - Around 30-50 words (1-2 sentences)
    - Maintain the story's theme of overcoming fears
    - Keep the character name as ${story.child.name}
    - Make it engaging and positive
    
    IMPORTANT: Return ONLY the story text as a plain string. Do NOT wrap it in JSON. Do NOT include any keys or brackets. Just return the story text directly.
  `;

  console.log(`[CHAT] Updating text with AI instruction: "${instruction}"`);
  console.log(`[CHAT] Full prompt being sent to LLM:`, prompt.substring(0, 200) + "...");
  const result = await invokeLLM(prompt);
  
  if (result.success) {
    try {
      let newText;
      if (typeof result.data === 'string') {
        // Check if it's JSON wrapped text
        const trimmed = result.data.trim();
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          try {
            const parsed = JSON.parse(trimmed);
            // Extract text from various possible JSON structures
            newText = parsed.text || parsed.content || parsed.story || 
                     Object.values(parsed)[0] || trimmed;
          } catch (e) {
            newText = trimmed;
          }
        } else {
          newText = trimmed;
        }
      } else if (result.data && typeof result.data === 'object') {
        // Handle case where LLM returns JSON object directly
        newText = result.data.text || result.data.content || result.data.story || 
                 Object.values(result.data)[0] || JSON.stringify(result.data);
      } else {
        newText = String(result.data).trim();
      }
      
      // Ensure newText is a string and clean it up
      if (typeof newText !== 'string') {
        newText = String(newText);
      }
      newText = newText.trim();
      
      // Get fresh page data to check current text (in case of previous updates)
      const freshPage = await prisma.storyPage.findUnique({
        where: { id: currentPage.id }
      });
      
      const currentText = freshPage?.text || currentPage.text;
      
      console.log(`[CHAT] Original text: "${currentText}" (type: ${typeof currentText})`);
      console.log(`[CHAT] New text generated: "${newText}" (type: ${typeof newText})`);
      
      // Check if current page text is corrupted (showing [object Object])
      if (currentText === "[object Object]" || typeof currentText !== 'string') {
        console.log(`[CHAT] Current page text is corrupted, forcing update`);
      } else if (newText === currentText) {
        console.log(`[CHAT] New text is identical to current text, but proceeding with update anyway for debugging`);
        // Temporarily commenting out this return to debug the issue
        // return {
        //   response: "The text is already as you requested, no changes needed.",
        //   updated: false,
        // };
      }
      
      const updatedPage = await prisma.storyPage.update({
        where: { id: currentPage.id },
        data: { text: newText },
      });
      
      console.log(`[CHAT] Successfully updated page ${currentPage.pageNumber} text in database`);
      console.log(`[CHAT] Database now contains: "${updatedPage.text}"`);
      console.log(`[CHAT] Returning updated: true for successful text update`);
      
      return {
        response: `I've updated the story text! Changed from: "${currentText}" to: "${newText}". The page will refresh automatically.`,
        updated: true,
      };
    } catch (error) {
      console.error(`[CHAT] Database update failed:`, error);
      return {
        response: "Sorry, I couldn't save the text update right now.",
        updated: false,
      };
    }
  }
  
  console.error(`[CHAT] Text update failed:`, result.error);
  return {
    response: "I had trouble generating the updated text. Could you try rephrasing your request?",
    updated: false,
  };
}

async function updateStoryImage(story: any, currentPage: any, instruction: string) {
  const prompt = `
    You are helping update a children's story illustration. Analyze the user's instruction and determine what type of illustration change they want.
    
    Current illustration prompt: "${currentPage.illustrationPrompt}"
    Character: ${story.child.name} - ${story.child.appearanceDescription}
    Page text: "${currentPage.text}"
    Story theme: Overcoming fear of ${story.fearDescription}
    
    User instruction: "${instruction}"
    
    DETECT STYLE CHANGES:
    - If the user mentions art style changes (cartoon, realistic, watercolor, oil painting, sketch, digital art, anime, etc.), this is a STYLE change
    - If the user mentions color scheme changes (bright, dark, pastel, vibrant, monochrome, etc.), this is a STYLE change  
    - If the user mentions mood changes (happy, scary, dreamy, magical, etc.), this could affect STYLE
    - If the user mentions specific visual elements (add rainbow, change background, different clothing), this is a CONTENT change
    
    INSTRUCTIONS:
    - For STYLE changes: Create a completely new illustration prompt that maintains the story content but applies the new visual style
    - For CONTENT changes: Modify the existing prompt to incorporate the new visual elements
    - Always maintain character consistency with ${story.child.name} and their appearance
    - Keep the illustration age-appropriate for a ${story.child.age}-year-old
    - Ensure the illustration supports the story's theme of overcoming fears
    
    Return ONLY the updated illustration prompt as plain text. Do NOT wrap in JSON or quotes.
  `;

  console.log(`[CHAT] Calling LLM to update illustration prompt with style detection...`);
  const result = await invokeLLM(prompt);
  console.log(`[CHAT] LLM result for illustration:`, result);
  
  if (result.success) {
    try {
      const newPrompt = typeof result.data === 'string' ? result.data.trim() : JSON.stringify(result.data);
      
      // Check if this is a significant style change by comparing prompts
      const isStyleChange = detectStyleChange(currentPage.illustrationPrompt, newPrompt, instruction);
      console.log(`[CHAT] Style change detected: ${isStyleChange}`);
      
      // Generate new illustration with enhanced prompt
      const enhancedPrompt = generateIllustrationPrompt(
        newPrompt,
        story.child.name,
        story.child.appearanceDescription,
        currentPage.text
      );
      
      console.log(`[CHAT] Enhanced prompt length:`, enhancedPrompt.length);
      console.log(`[CHAT] Generating image with enhanced prompt...`);
      
      // For style changes, we might want to generate multiple attempts or use different parameters
      let imageResult;
      if (isStyleChange) {
        console.log(`[CHAT] Processing as style change - using enhanced generation`);
        imageResult = await generateImageWithStyleChange(enhancedPrompt, instruction);
      } else {
        imageResult = await generateImage(enhancedPrompt);
      }
      
      console.log(`[CHAT] Image generation result:`, imageResult);
      
      if (imageResult.success && imageResult.data?.url) {
        console.log(`[CHAT] Successfully generated new image, updating page ${currentPage.id}`);
        await prisma.storyPage.update({
          where: { id: currentPage.id },
          data: {
            illustrationPrompt: newPrompt,
            illustrationUrl: imageResult.data.url,
          },
        });
        console.log(`[CHAT] Successfully updated page illustration in database`);
        
        const responseMessage = isStyleChange ? 
          "I've updated the illustration with your new style! The image should appear with the new visual approach shortly." :
          "I've updated the illustration for this page! The new image should appear shortly.";
        
        return {
          response: responseMessage,
          updated: true,
        };
      } else {
        console.error("Image generation failed:", imageResult.error);
        return {
          response: `I couldn't generate the new image. Error: ${imageResult.error || 'Unknown error'}. Please try again or check your OpenAI API configuration.`,
          updated: false,
        };
      }
    } catch (error) {
      console.error("Error in updateStoryImage:", error);
      return {
        response: `Sorry, I couldn't update the illustration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        updated: false,
      };
    }
  }
  
  return {
    response: "I had trouble understanding how to update the illustration.",
    updated: false,
  };
}

async function updateGlobalCharacteristic(story: any, instruction: string) {
  // This would update character appearance across all pages
  const prompt = `
    The user wants to make a global change to the character ${story.child.name}.
    Current appearance: ${story.child.appearanceDescription}
    
    User instruction: "${instruction}"
    
    Return an updated character appearance description that incorporates the change.
  `;

  const result = await invokeLLM(prompt);
  
  if (result.success) {
    try {
      const newAppearance = result.data.trim();
      
      // Update character description
      await prisma.child.update({
        where: { id: story.child.id },
        data: { appearanceDescription: newAppearance },
      });
      
      // Queue regeneration of all illustrations (could be done in background)
      // For now, just update the prompts
      const pages = await prisma.storyPage.findMany({
        where: { storyId: story.id },
      });
      
      const updatePromises = pages.map(page => {
        const updatedPrompt = page.illustrationPrompt.replace(
          story.child.appearanceDescription,
          newAppearance
        );
        
        return prisma.storyPage.update({
          where: { id: page.id },
          data: { illustrationPrompt: updatedPrompt },
        });
      });
      
      await Promise.all(updatePromises);
      
      return {
        response: `I've updated ${story.child.name}'s appearance across all pages! The illustrations will be regenerated.`,
        updated: true,
      };
    } catch (error) {
      return {
        response: "Sorry, I couldn't make that global change right now.",
        updated: false,
      };
    }
  }
  
  return {
    response: "I had trouble understanding the global change you wanted.",
    updated: false,
  };
}

function detectStyleChange(oldPrompt: string, newPrompt: string, userInstruction: string): boolean {
  const styleKeywords = [
    'style', 'cartoon', 'realistic', 'watercolor', 'oil painting', 'sketch', 
    'digital art', 'anime', 'manga', 'impressionist', 'abstract', 'minimalist',
    'bright', 'dark', 'pastel', 'vibrant', 'monochrome', 'colorful', 'black and white',
    'happy', 'scary', 'dreamy', 'magical', 'mysterious', 'cheerful', 'gloomy',
    'art style', 'drawing style', 'painting style', 'visual style'
  ];
  
  const instruction = userInstruction.toLowerCase();
  const hasStyleKeywords = styleKeywords.some(keyword => instruction.includes(keyword));
  
  // Check if the prompts are significantly different in style-related content
  const oldStyle = extractStyleElements(oldPrompt);
  const newStyle = extractStyleElements(newPrompt);
  const hasSignificantStyleChange = oldStyle !== newStyle;
  
  console.log(`[CHAT] Style detection - Keywords: ${hasStyleKeywords}, Significant change: ${hasSignificantStyleChange}`);
  
  return hasStyleKeywords || hasSignificantStyleChange;
}

function extractStyleElements(prompt: string): string {
  const stylePattern = /\b(cartoon|realistic|watercolor|oil painting|sketch|digital art|anime|bright|dark|pastel|vibrant|monochrome|dreamy|magical|mysterious|cheerful|gloomy)\b/gi;
  const matches = prompt.match(stylePattern);
  return matches ? matches.join(' ').toLowerCase() : '';
}

async function generateImageWithStyleChange(enhancedPrompt: string, styleInstruction: string) {
  // For style changes, we might want to add extra style emphasis to the prompt
  const styleEnhancedPrompt = `${enhancedPrompt} Style note: ${styleInstruction}`;
  
  console.log(`[CHAT] Generating image with style-enhanced prompt...`);
  
  // Try generating the image with the style-enhanced prompt
  const result = await generateImage(styleEnhancedPrompt);
  
  if (!result.success) {
    // Fallback to regular prompt if style-enhanced fails
    console.log(`[CHAT] Style-enhanced generation failed, trying regular prompt...`);
    return await generateImage(enhancedPrompt);
  }
  
  return result;
}