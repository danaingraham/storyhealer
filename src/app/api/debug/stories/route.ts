import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log(`[DEBUG] Fetching stories for user: ${session.user.id}`);

    // Get all stories for the user
    const stories = await prisma.story.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        child: true,
        pages: {
          orderBy: { pageNumber: "asc" },
          take: 1, // Just first page for preview
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    console.log(`[DEBUG] Found ${stories.length} stories`);
    stories.forEach(story => {
      console.log(`[DEBUG] - Story: "${story.title}" (${story.pages.length} pages), Child: ${story.child.name}`);
    });

    return NextResponse.json({
      userId: session.user.id,
      userEmail: session.user.email,
      storiesCount: stories.length,
      stories: stories.map(story => ({
        id: story.id,
        title: story.title,
        childName: story.child.name,
        pagesCount: story.pages.length,
        generationStatus: story.generationStatus
      }))
    });
  } catch (error) {
    console.error("[DEBUG] Failed to fetch stories:", error);
    return NextResponse.json(
      { error: "Failed to fetch stories", details: error },
      { status: 500 }
    );
  }
}