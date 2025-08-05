import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Please sign in first" }, { status: 401 });
    }

    const { message, storyId } = await request.json();
    
    if (!message || !storyId) {
      return NextResponse.json({ error: "message and storyId required" }, { status: 400 });
    }

    console.log(`[CHAT-TEST] Testing chat with story: ${storyId}, message: "${message}"`);

    // Find the first page of the story to test with
    const story = await prisma.story.findFirst({
      where: {
        id: storyId,
        userId: session.user.id,
      },
      include: {
        child: true,
        pages: {
          orderBy: { pageNumber: "asc" },
          take: 1,
        },
      },
    });

    if (!story || !story.pages.length) {
      return NextResponse.json({ error: "Story or pages not found" });
    }

    // Call the actual chat endpoint
    const chatResponse = await fetch(`http://localhost:3000/api/stories/${storyId}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": request.headers.get("cookie") || "",
      },
      body: JSON.stringify({
        message,
        pageNumber: story.pages[0].pageNumber,
        conversationHistory: [],
      }),
    });

    const result = await chatResponse.json();
    
    console.log(`[CHAT-TEST] Chat response:`, result);

    return NextResponse.json({
      success: chatResponse.ok,
      status: chatResponse.status,
      result,
      storyInfo: {
        title: story.title,
        character: story.child.name,
        pageText: story.pages[0].text,
      },
    });

  } catch (error) {
    console.error("[CHAT-TEST] Error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}