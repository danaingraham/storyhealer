import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateImage, generateIllustrationPrompt } from "@/lib/ai";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Please sign in first" }, { status: 401 });
    }

    console.log(`[IMG-TEST] Starting illustration test for user: ${session.user.id}`);

    // Find any existing story with pages
    const storyWithPages = await prisma.story.findFirst({
      where: { userId: session.user.id },
      include: {
        child: true,
        pages: {
          orderBy: { pageNumber: "asc" },
          take: 1, // Just test with one page
        },
      },
    });

    if (!storyWithPages || !storyWithPages.pages.length) {
      return NextResponse.json({ 
        error: "No story with pages found. Create a story first.",
        suggestion: "Visit /story/create to create a story first"
      });
    }

    const story = storyWithPages;
    const page = story.pages[0];

    console.log(`[IMG-TEST] Found story: ${story.id}, page: ${page.pageNumber}`);
    console.log(`[IMG-TEST] Page text: ${page.text}`);
    console.log(`[IMG-TEST] Page illustration prompt: ${page.illustrationPrompt}`);

    // Test 1: Generate illustration prompt
    console.log(`[IMG-TEST] Testing illustration prompt generation...`);
    const enhancedPrompt = generateIllustrationPrompt(
      page.illustrationPrompt,
      story.child.name,
      story.child.appearanceDescription,
      page.text
    );

    console.log(`[IMG-TEST] Enhanced prompt length: ${enhancedPrompt.length}`);
    console.log(`[IMG-TEST] Enhanced prompt preview: ${enhancedPrompt.substring(0, 200)}...`);

    // Test 2: Generate image
    console.log(`[IMG-TEST] Testing image generation...`);
    const imageResult = await generateImage(enhancedPrompt);

    console.log(`[IMG-TEST] Image result success: ${imageResult.success}`);
    if (imageResult.success) {
      console.log(`[IMG-TEST] Image URL: ${imageResult.data?.url}`);
      
      // Test 3: Update database
      console.log(`[IMG-TEST] Testing database update...`);
      try {
        await prisma.storyPage.update({
          where: { id: page.id },
          data: { illustrationUrl: imageResult.data.url },
        });
        console.log(`[IMG-TEST] Database update successful`);
      } catch (dbError) {
        console.error(`[IMG-TEST] Database update failed:`, dbError);
        return NextResponse.json({
          success: false,
          error: "Database update failed",
          details: dbError instanceof Error ? dbError.message : "Unknown DB error",
          imageGenerated: true,
          imageUrl: imageResult.data?.url,
        });
      }
    } else {
      console.error(`[IMG-TEST] Image generation failed:`, imageResult.error);
    }

    return NextResponse.json({
      success: imageResult.success,
      storyId: story.id,
      pageId: page.id,
      enhancedPrompt,
      imageResult,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("[IMG-TEST] Fatal error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Please sign in first" }, { status: 401 });
    }

    const { storyId } = await request.json();
    
    if (!storyId) {
      return NextResponse.json({ error: "storyId required" }, { status: 400 });
    }

    console.log(`[IMG-TEST-POST] Testing illustrations for story: ${storyId}`);

    // Call the actual illustration endpoint
    const response = await fetch(`http://localhost:3000/api/stories/${storyId}/illustrations`, {
      method: "POST",
      headers: {
        "Cookie": request.headers.get("cookie") || "",
      },
    });

    const result = await response.json();
    
    console.log(`[IMG-TEST-POST] Illustration endpoint response:`, result);

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      result,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("[IMG-TEST-POST] Error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}