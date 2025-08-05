import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    console.log("OpenAI LLM: Received prompt request");

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

    // Determine if this is a story generation (JSON) or text editing (plain text) request
    const isStoryGeneration = prompt.includes("Format the response as JSON") || prompt.includes("Create a heartwarming");
    const isTextEditing = prompt.includes("Return ONLY the story text as a plain string");
    
    let systemMessage;
    if (isTextEditing) {
      systemMessage = "You are a helpful children's story editor. Respond with ONLY the updated story text as a plain string. Do not include any JSON, brackets, or additional formatting. Just return the story text directly.";
    } else if (isStoryGeneration) {
      systemMessage = "You are a creative children's story writer who creates heartwarming, age-appropriate stories that help children overcome their fears. Always respond with ONLY valid JSON matching the expected format, no additional text.";
    } else {
      systemMessage = "You are a helpful assistant for children's story creation and editing. Respond appropriately based on the request.";
    }

    console.log("OpenAI LLM: Calling OpenAI API...", isTextEditing ? "(text editing mode)" : isStoryGeneration ? "(story generation mode)" : "(general mode)");
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemMessage
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 2000,
    });
    console.log("OpenAI LLM: Received response from OpenAI");

    const responseContent = completion.choices[0].message.content;
    
    // Handle different response types
    if (isTextEditing) {
      // For text editing, return the plain text directly
      return NextResponse.json({ result: responseContent });
    } else {
      // For story generation, parse as JSON
      try {
        const jsonResponse = JSON.parse(responseContent || "{}");
        return NextResponse.json({ result: jsonResponse });
      } catch (parseError) {
        console.error("Failed to parse OpenAI response as JSON:", responseContent);
        return NextResponse.json(
          { error: "Invalid response format from AI" },
          { status: 500 }
        );
      }
    }
  } catch (error: any) {
    console.error("OpenAI API error:", error);
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
      { error: `Failed to generate story: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}