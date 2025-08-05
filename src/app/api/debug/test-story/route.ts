import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invokeLLM, generateImage } from "@/lib/ai";

export async function GET() {
  const results = {
    database: false,
    llm: false,
    imageGeneration: false,
    errors: [] as string[],
  };

  try {
    // Test 1: Database connection
    console.log("DEBUG: Testing database connection...");
    try {
      const userCount = await prisma.user.count();
      results.database = true;
      console.log(`DEBUG: Database connected. Users: ${userCount}`);
    } catch (error) {
      results.errors.push(`Database error: ${error}`);
      console.error("DEBUG: Database error:", error);
    }

    // Test 2: LLM (Story Generation)
    console.log("DEBUG: Testing LLM...");
    try {
      const testPrompt = `Return a simple JSON object with this exact structure: {"test": "success", "message": "LLM is working"}`;
      const llmResult = await invokeLLM(testPrompt);
      
      if (llmResult.success) {
        results.llm = true;
        console.log("DEBUG: LLM response:", llmResult.data);
      } else {
        results.errors.push(`LLM error: ${llmResult.error}`);
        console.error("DEBUG: LLM error:", llmResult.error);
      }
    } catch (error) {
      results.errors.push(`LLM error: ${error}`);
      console.error("DEBUG: LLM error:", error);
    }

    // Test 3: Image Generation
    console.log("DEBUG: Testing image generation...");
    try {
      const imageResult = await generateImage("A simple red circle on white background");
      
      if (imageResult.success && imageResult.data?.url) {
        results.imageGeneration = true;
        console.log("DEBUG: Image URL:", imageResult.data.url);
      } else {
        results.errors.push(`Image generation error: ${imageResult.error}`);
        console.error("DEBUG: Image generation error:", imageResult.error);
      }
    } catch (error) {
      results.errors.push(`Image generation error: ${error}`);
      console.error("DEBUG: Image generation error:", error);
    }

    return NextResponse.json({
      success: results.database && results.llm && results.imageGeneration,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("DEBUG: Test endpoint error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      results,
    });
  }
}