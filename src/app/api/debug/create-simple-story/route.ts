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

    console.log(`[SIMPLE-STORY] Creating simple test story for user: ${session.user.id}`);

    // Create test child
    const child = await prisma.child.create({
      data: {
        userId: session.user.id,
        name: "Alex",
        age: 5,
        appearanceDescription: "A cheerful child with brown hair and bright eyes",
      },
    });

    console.log(`[SIMPLE-STORY] Created child: ${child.id}`);

    // Create story with predefined content
    const story = await prisma.story.create({
      data: {
        userId: session.user.id,
        childId: child.id,
        title: "Alex and the Nighttime Adventure",
        fearDescription: "afraid of the dark",
        characterDescriptions: {},
        generationStatus: "COMPLETED",
      },
    });

    console.log(`[SIMPLE-STORY] Created story: ${story.id}`);

    // Create 2 simple pages
    const pages = [
      {
        pageNumber: 1,
        text: "Once upon a time, Alex was getting ready for bed but felt scared of the dark.",
        illustrationPrompt: "Alex sitting on the edge of the bed, looking nervous in a dimly lit bedroom",
      },
      {
        pageNumber: 2,
        text: "Suddenly, a friendly firefly named Spark appeared, lighting up the room with a warm glow.",
        illustrationPrompt: "Alex watching Spark the firefly flying around, casting a soft, comforting light",
      },
    ];

    for (const pageData of pages) {
      await prisma.storyPage.create({
        data: {
          storyId: story.id,
          pageNumber: pageData.pageNumber,
          text: pageData.text,
          illustrationPrompt: pageData.illustrationPrompt,
        },
      });
    }

    console.log(`[SIMPLE-STORY] Created ${pages.length} pages`);

    // Now generate illustrations
    console.log(`[SIMPLE-STORY] Generating illustrations...`);
    const illustrationsResponse = await fetch(`http://localhost:3000/api/stories/${story.id}/illustrations`, {
      method: "POST",
      headers: {
        "Cookie": request.headers.get("cookie") || "",
      },
    });

    const illustrationsResult = await illustrationsResponse.json();
    console.log(`[SIMPLE-STORY] Illustrations result:`, illustrationsResult);

    return NextResponse.json({
      success: true,
      story: {
        id: story.id,
        title: story.title,
      },
      child: {
        id: child.id,
        name: child.name,
      },
      illustrationsGenerated: illustrationsResponse.ok,
      illustrationsResult,
      viewUrl: `/story/${story.id}`,
    });

  } catch (error) {
    console.error("[SIMPLE-STORY] Error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}