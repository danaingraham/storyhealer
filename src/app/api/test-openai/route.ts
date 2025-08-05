import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function GET() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: "OpenAI API key is not configured"
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Simple test to check if the API key works
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Say 'API key is working!'" }],
      max_tokens: 10,
    });

    return NextResponse.json({
      success: true,
      message: completion.choices[0].message.content,
      keyPrefix: process.env.OPENAI_API_KEY.substring(0, 10) + "..."
    });
  } catch (error: any) {
    console.error("Test OpenAI error:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code || error.status,
      type: error.type
    });
  }
}