import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Please sign in first" }, { status: 401 });
    }

    console.log(`[DEBUG-CREATE] User: ${session.user.id}`);

    // Create a test story by calling the actual APIs
    const testCharacterData = {
      name: "Test Child",
      age: 5,
      appearanceDescription: "A cheerful child with brown hair and bright eyes",
    };

    console.log(`[DEBUG-CREATE] Creating child...`);
    const childResponse = await fetch("http://localhost:3000/api/children", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Cookie": request.headers.get("cookie") || ""
      },
      body: JSON.stringify(testCharacterData),
    });

    if (!childResponse.ok) {
      const error = await childResponse.text();
      console.error(`[DEBUG-CREATE] Child creation failed:`, error);
      return NextResponse.json({ error: "Failed to create child", details: error });
    }

    const child = await childResponse.json();
    console.log(`[DEBUG-CREATE] Child created: ${child.id}`);

    // Create story
    console.log(`[DEBUG-CREATE] Creating story...`);
    const storyResponse = await fetch("http://localhost:3000/api/stories", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Cookie": request.headers.get("cookie") || ""
      },
      body: JSON.stringify({
        childId: child.id,
        fearDescription: "afraid of the dark",
      }),
    });

    if (!storyResponse.ok) {
      const error = await storyResponse.text();
      console.error(`[DEBUG-CREATE] Story creation failed:`, error);
      return NextResponse.json({ error: "Failed to create story", details: error });
    }

    const story = await storyResponse.json();
    console.log(`[DEBUG-CREATE] Story created: ${story.id}`);

    return NextResponse.json({
      success: true,
      child,
      story,
      message: "Test story created successfully. Check terminal for logs.",
    });

  } catch (error) {
    console.error("[DEBUG-CREATE] Error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}