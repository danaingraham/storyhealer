import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    console.log("OpenAI Image: Received image generation request");

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key is not configured");
      return NextResponse.json(
        { error: "OpenAI API key is not configured" },
        { status: 500 }
      );
    }

    // Create a child-friendly version of the prompt
    const enhancedPrompt = `Create a colorful, whimsical, child-friendly illustration in a storybook style. ${prompt}. The image should be warm, inviting, and suitable for young children. Use soft, vibrant colors and a magical atmosphere.`;

    console.log("OpenAI Image: Calling DALL-E 3...");
    console.log("OpenAI Image: Prompt length:", enhancedPrompt.length);
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: enhancedPrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "vivid",
    });
    console.log("OpenAI Image: Received response from DALL-E");

    const imageUrl = response.data?.[0]?.url;

    if (!imageUrl) {
      throw new Error("No image URL returned from OpenAI");
    }

    return NextResponse.json({ url: imageUrl });
  } catch (error: any) {
    console.error("OpenAI Image API error:", error);
    console.error("Error details:", error.message);
    if (error.response) {
      console.error("API Response:", error.response.data);
    }
    
    // Check for common errors
    if (error.code === 'insufficient_quota') {
      return NextResponse.json(
        { error: "OpenAI API quota exceeded. Please check your billing." },
        { status: 429 }
      );
    }
    
    if (error.status === 401) {
      return NextResponse.json(
        { error: "Invalid OpenAI API key. Please check your configuration." },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: `Failed to generate image: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}