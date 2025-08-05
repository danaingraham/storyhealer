import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function GET() {
  try {
    console.log("Testing OpenAI connection...");
    
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: "OPENAI_API_KEY environment variable is not set",
        instructions: "You need to set your OpenAI API key in the environment variables"
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log("Making test API call to OpenAI...");
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: "Say 'Hello, OpenAI is working!' in a friendly way."
        }
      ],
      max_tokens: 50,
    });

    const response = completion.choices[0].message.content;
    
    return NextResponse.json({
      success: true,
      message: "OpenAI connection is working!",
      testResponse: response,
      apiKeyStatus: "✅ API key is configured",
      model: "gpt-3.5-turbo"
    });

  } catch (error: any) {
    console.error("OpenAI connection test failed:", error);
    
    let errorMessage = "Unknown error";
    let instructions = "";
    
    if (error.status === 401) {
      errorMessage = "Invalid API key";
      instructions = "Check that your OPENAI_API_KEY is correct and valid";
    } else if (error.code === 'insufficient_quota') {
      errorMessage = "OpenAI quota exceeded";
      instructions = "Check your OpenAI billing and usage limits";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      instructions: instructions,
      apiKeyExists: !!process.env.OPENAI_API_KEY,
      errorDetails: {
        status: error.status,
        code: error.code,
        type: error.type
      }
    });
  }
}