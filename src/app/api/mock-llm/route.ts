import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    // Mock responses based on prompt content
    let mockResponse = "";
    
    if (prompt.includes("story")) {
      // Mock story generation
      mockResponse = JSON.stringify({
        title: "Emma's Brave Adventure",
        pages: [
          {
            page_number: 1,
            text: "Once upon a time, there was a brave little girl named Emma who was afraid of the dark.",
            illustration_prompt: "A young girl looking worried in her bedroom at night",
            characters_in_scene: ["Emma"]
          },
          {
            page_number: 2,
            text: "One night, Emma decided she would be brave and face her fear of the darkness.",
            illustration_prompt: "Emma standing courageously in her room with a determined expression",
            characters_in_scene: ["Emma"]
          },
          {
            page_number: 3,
            text: "She discovered that the dark wasn't scary at all - it was just nighttime saying hello.",
            illustration_prompt: "Emma smiling in a softly moonlit room, looking peaceful",
            characters_in_scene: ["Emma"]
          },
          {
            page_number: 4,
            text: "Emma learned that being brave doesn't mean you're not scared - it means you do something even when you are scared.",
            illustration_prompt: "Emma confidently walking through her house at night",
            characters_in_scene: ["Emma"]
          },
          {
            page_number: 5,
            text: "From that night on, Emma felt proud of herself for being so brave.",
            illustration_prompt: "Emma sleeping peacefully with a confident smile",
            characters_in_scene: ["Emma"]
          },
          {
            page_number: 6,
            text: "And she lived happily ever after, knowing she could be brave whenever she needed to be.",
            illustration_prompt: "Emma playing happily in the morning sunlight",
            characters_in_scene: ["Emma"]
          }
        ]
      });
    } else if (prompt.includes("analyze") || prompt.includes("photo")) {
      // Mock photo analysis
      mockResponse = "A cheerful 6-year-old child with brown hair, bright eyes, and a friendly smile. They appear confident and playful, with a kind expression.";
    } else if (prompt.includes("intent") || prompt.includes("user message")) {
      // Mock intent analysis
      mockResponse = JSON.stringify({
        updateType: "text",
        instruction: "Make the story more exciting and adventurous",
        scope: "current_page"
      });
    } else {
      // Default mock response
      mockResponse = "This is a mock AI response. The real AI would process your request here.";
    }
    
    return NextResponse.json(mockResponse);
  } catch (error) {
    return NextResponse.json(
      { error: "Mock LLM service error" },
      { status: 500 }
    );
  }
}