import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invokeLLM, generateStoryPrompt } from "@/lib/ai";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { childId, fearDescription } = body;

    if (!childId || !fearDescription) {
      return NextResponse.json(
        { error: "Child ID and fear description are required" },
        { status: 400 }
      );
    }

    // Verify child belongs to user
    const child = await prisma.child.findFirst({
      where: {
        id: childId,
        userId: session.user.id,
      },
    });

    if (!child) {
      return NextResponse.json(
        { error: "Child not found" },
        { status: 404 }
      );
    }

    // Create story record
    const story = await prisma.story.create({
      data: {
        userId: session.user.id,
        childId,
        title: `${child.name}'s Brave Adventure`,
        fearDescription,
        characterDescriptions: {
          main_character: {
            name: child.name,
            age: child.age,
            appearance: child.appearanceDescription,
          },
        },
        generationStatus: "GENERATING",
        shareToken: uuidv4(),
      },
    });

    // Generate story content in background
    console.log(`[STORY-API] Starting content generation for story ${story.id}`);
    await generateStoryContent(story.id, child, fearDescription);
    console.log(`[STORY-API] Content generation completed for story ${story.id}`);

    return NextResponse.json(story);
  } catch (error) {
    console.error("Failed to create story:", error);
    return NextResponse.json(
      { error: "Failed to create story" },
      { status: 500 }
    );
  }
}

async function generateStoryContent(
  storyId: string,
  child: any,
  fearDescription: string
) {
  try {
    console.log(`[STORY-GEN] === STARTING STORY GENERATION ===`);
    console.log(`[STORY-GEN] Story ID: ${storyId}`);
    console.log(`[STORY-GEN] Child: ${child.name} (age ${child.age})`);
    console.log(`[STORY-GEN] Fear: ${fearDescription}`);
    console.log(`[STORY-GEN] Appearance: ${child.appearanceDescription?.substring(0, 100)}...`);
    
    const prompt = generateStoryPrompt(
      child.name,
      child.age,
      fearDescription,
      child.appearanceDescription
    );

    console.log(`[STORY-GEN] Generated prompt length: ${prompt.length}`);
    console.log(`[STORY-GEN] Calling LLM...`);
    const result = await invokeLLM(prompt);

    if (!result.success) {
      console.error(`[STORY-GEN] LLM failed:`, result.error);
      throw new Error(result.error || "Failed to generate story");
    }

    console.log(`[STORY-GEN] LLM response received, type: ${typeof result.data}`);
    console.log(`[STORY-GEN] Raw response preview:`, JSON.stringify(result.data).substring(0, 200) + "...");
    
    let storyData;
    try {
      // Handle both direct JSON and wrapped responses
      if (typeof result.data === 'string') {
        console.log(`[STORY-GEN] Parsing string response...`);
        storyData = JSON.parse(result.data);
      } else if (result.data && typeof result.data === 'object') {
        console.log(`[STORY-GEN] Using object response directly...`);
        storyData = result.data;
      } else {
        console.error(`[STORY-GEN] Invalid response format:`, result.data);
        throw new Error("Invalid response format from LLM");
      }
      
      console.log(`[STORY-GEN] Parsed story data:`, {
        title: storyData.title,
        pages: storyData.pages?.length || 0,
        hasPages: !!storyData.pages,
      });
      
    } catch (parseError) {
      console.error(`[STORY-GEN] Parse error:`, parseError);
      console.error(`[STORY-GEN] Raw data:`, result.data);
      throw new Error("Failed to parse story data");
    }

    // Update story with generated content
    await prisma.story.update({
      where: { id: storyId },
      data: {
        title: storyData.title,
        generationStatus: "COMPLETED",
      },
    });

    // Create story pages
    console.log(`[STORY-GEN] Creating ${storyData.pages.length} pages...`);
    
    const pagePromises = storyData.pages.map((page: any, index: number) => {
      console.log(`[STORY-GEN] Page ${index + 1} data:`, {
        pageNumber: page.page_number,
        hasText: !!page.text,
        hasPrompt: !!page.illustration_prompt,
        textLength: page.text?.length || 0
      });
      
      return prisma.storyPage.create({
        data: {
          storyId,
          pageNumber: page.page_number,
          text: page.text,
          illustrationPrompt: page.illustration_prompt,
          charactersInScene: page.characters_in_scene || [child.name],
        },
      });
    });

    try {
      await Promise.all(pagePromises);
      console.log(`[STORY-GEN] Successfully created all ${storyData.pages.length} pages`);
    } catch (pageError) {
      console.error(`[STORY-GEN] Failed to create pages:`, pageError);
      throw pageError;
    }
  } catch (error) {
    console.error("Story generation failed:", error);
    
    // Mark story as error
    await prisma.story.update({
      where: { id: storyId },
      data: {
        generationStatus: "ERROR",
        errorMessage: error instanceof Error ? error.message : "Generation failed",
      },
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stories = await prisma.story.findMany({
      where: { userId: session.user.id },
      include: {
        child: true,
        pages: {
          orderBy: { pageNumber: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(stories);
  } catch (error) {
    console.error("Failed to fetch stories:", error);
    return NextResponse.json(
      { error: "Failed to fetch stories" },
      { status: 500 }
    );
  }
}