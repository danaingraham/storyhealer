import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        status: "error",
        message: "OpenAI API key is not configured in environment variables"
      });
    }

    // Check if API key format looks valid
    if (!apiKey.startsWith('sk-')) {
      return NextResponse.json({
        status: "error",
        message: "OpenAI API key format appears invalid (should start with 'sk-')"
      });
    }

    const openai = new OpenAI({ apiKey });

    // Try a simple test with DALL-E
    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: "A simple test: a red circle on white background",
        n: 1,
        size: "1024x1024",
        quality: "standard",
        style: "natural",
      });

      return NextResponse.json({
        status: "success",
        message: "DALL-E API is working correctly!",
        imageUrl: response.data?.[0]?.url
      });
    } catch (error: any) {
      console.error("DALL-E test error:", error);
      
      if (error.status === 401) {
        return NextResponse.json({
          status: "error",
          message: "Invalid API key. Please check your OpenAI API key.",
          error: error.message
        });
      }
      
      if (error.code === 'insufficient_quota') {
        return NextResponse.json({
          status: "error",
          message: "OpenAI API quota exceeded. Please check your billing at https://platform.openai.com/account/billing",
          error: error.message
        });
      }

      return NextResponse.json({
        status: "error",
        message: "DALL-E API test failed",
        error: error.message || "Unknown error",
        details: error.response?.data || {}
      });
    }
  } catch (error) {
    return NextResponse.json({
      status: "error",
      message: "Unexpected error during test",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}