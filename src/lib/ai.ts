export interface AIResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export async function invokeLLM(prompt: string): Promise<AIResponse> {
  try {
    console.log("AI lib: Invoking LLM with prompt length:", prompt.length);
    
    // Use absolute URL for server-side calls
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const apiUrl = `${baseUrl}/api/openai-llm`;
    console.log("AI lib: Calling API at:", apiUrl);
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    console.log("AI lib: Received response with status:", response.status);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "No error text");
      let errorData = {};
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        // errorText is not JSON
      }
      
      console.error("AI lib: LLM API error details:", {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 500),
        errorData
      });
      
      const errorMessage = (errorData as any).error || 
                          (errorData as any).message || 
                          errorText || 
                          `LLM API error: ${response.statusText}`;
      
      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    console.log("AI lib: LLM response received successfully, data:", responseData);
    
    // Extract the actual result from the response
    const result = responseData.result || responseData.data || responseData;
    console.log("AI lib: Extracted result:", typeof result, result?.substring ? result.substring(0, 100) + "..." : result);
    
    return { success: true, data: result };
  } catch (error) {
    console.error("AI lib: LLM invocation failed with error:", error);
    console.error("AI lib: Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "LLM service unavailable",
    };
  }
}

export async function generateImage(prompt: string): Promise<AIResponse> {
  try {
    console.log("AI lib: Starting image generation");
    const enhancedPrompt = `${prompt}. Children's book illustration style, colorful, friendly, safe for kids. No text, no letters, no words in the image.`;
    
    // Use absolute URL for server-side calls
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const apiUrl = `${baseUrl}/api/openai-image`;
    console.log("AI lib: Calling image API at:", apiUrl);
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: enhancedPrompt }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("AI lib: Image generation API error:", response.status, errorData);
      throw new Error(errorData.error || `Image generation API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("AI lib: Image generation successful");
    
    // Ensure we return the URL in a consistent format
    const imageUrl = data.url || data.data?.url || data.image_url;
    if (!imageUrl) {
      throw new Error("No image URL returned from API");
    }
    
    return { success: true, data: { url: imageUrl } };
  } catch (error) {
    console.error("AI lib: Image generation failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Image generation service unavailable",
    };
  }
}

export async function uploadFile(file: File): Promise<AIResponse> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(process.env.UPLOAD_FILE_URL!, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`File upload API error: ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("File upload failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "File upload service unavailable",
    };
  }
}

export async function analyzePhoto(imageData: string): Promise<AIResponse> {
  const prompt = `
    Analyze this photo of a child and create a detailed appearance description that can be used to generate consistent character illustrations. Focus on:
    
    1. Age range and physical build
    2. Hair color, length, and style
    3. Eye color if visible
    4. Skin tone
    5. Notable features (glasses, freckles, etc.)
    6. General facial expression and demeanor
    
    Return a natural, descriptive paragraph that captures the child's appearance in a way suitable for creating illustrations. Keep it positive and child-friendly.
  `;

  try {
    const response = await fetch(process.env.OPENAI_VISION_URL || "http://localhost:3000/api/openai-vision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, imageData }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `Failed to analyze photo (${response.status})`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data || { description: data.result },
    };
  } catch (error) {
    console.error("Photo analysis error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to analyze photo",
    };
  }
}

export function generateStoryPrompt(childName: string, age: number, fearDescription: string, appearance: string): string {
  return `
    Create a heartwarming, age-appropriate children's story for ${childName}, a ${age}-year-old child who is afraid of ${fearDescription}.
    
    Character appearance: ${appearance}
    
    Requirements:
    - Exactly 6 pages of story content
    - ${childName} must be the brave hero who overcomes their fear
    - Age-appropriate language for a ${age}-year-old
    - Positive, encouraging tone that builds confidence
    - Each page should have 2-3 sentences (about 30-50 words per page)
    - Story should show gradual progression from fear to courage
    - Include supportive friends, family, or magical helpers
    - End with ${childName} feeling proud and confident
    
    Format the response as JSON with this structure:
    {
      "title": "Story Title",
      "pages": [
        {
          "page_number": 1,
          "text": "Page 1 story text...",
          "illustration_prompt": "Detailed description for AI image generation...",
          "characters_in_scene": ["character1", "character2"]
        },
        ... (6 pages total)
      ]
    }
    
    Make each illustration_prompt very detailed, including the scene setting, character positions, emotions, and visual elements. Always include "${childName}" as the main character with this appearance: ${appearance}.
  `;
}

export function generateIllustrationPrompt(
  basePrompt: string,
  childName: string,
  appearance: string,
  pageContext?: string
): string {
  // Emphasize consistency and exact appearance to prevent diversity modifications
  return `
    Create a children's book illustration showing EXACTLY this specific child character throughout the entire story:
    
    CRITICAL - EXACT CHARACTER APPEARANCE (must be consistent across all pages):
    Name: ${childName}
    EXACT Appearance: ${appearance}
    
    IMPORTANT: This is the SAME child character ${childName} who appears in every page of this story. 
    DO NOT change their ethnicity, skin color, hair color, or any physical features between pages.
    The character must look EXACTLY as described above - maintain complete consistency.
    
    SCENE TO ILLUSTRATE: "${pageContext}"
    
    SCENE DETAILS: ${basePrompt}
    
    STYLE REQUIREMENTS:
    - Professional children's book illustration (like modern picture books)
    - Warm, friendly, colorful style
    - Show the character's emotions matching the story text
    - Include background elements from the scene
    - Child-friendly and age-appropriate
    
    REMEMBER: The character ${childName} must look EXACTLY the same as described in the appearance above. 
    No variations in ethnicity, features, or physical characteristics.
    
    VISUAL STYLE:
    - High-quality digital illustration style
    - Soft, rounded shapes and child-friendly proportions
    - Expressive faces and body language
    - Rich, saturated but gentle colors
    - Professional children's book quality
    
    TECHNICAL REQUIREMENTS:
    - No text, letters, or words anywhere in the image
    - Safe, positive, age-appropriate content
    - Clear focus on the story action and character
    - Composition suitable for a book page layout
    - High detail and visual interest for children
    
    Create an illustration that brings the story text to life visually, showing exactly what ${childName} is doing and experiencing in this part of the story.
  `;
}