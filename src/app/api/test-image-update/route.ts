import { NextRequest, NextResponse } from "next/server";
import { generateImage } from "@/lib/ai";

export async function GET(request: NextRequest) {
  try {
    // Test with a simple prompt
    const testPrompt = "A happy child reading a colorful book in a sunny garden";
    
    console.log("Testing image generation with prompt:", testPrompt);
    const result = await generateImage(testPrompt);
    console.log("Image generation result:", result);
    
    if (result.success) {
      return NextResponse.json({
        status: "success",
        message: "Image generation is working!",
        imageUrl: result.data?.url,
        fullResult: result
      });
    } else {
      return NextResponse.json({
        status: "error",
        message: "Image generation failed",
        error: result.error,
        fullResult: result
      });
    }
  } catch (error) {
    console.error("Test error:", error);
    return NextResponse.json({
      status: "error",
      message: "Unexpected error during test",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}