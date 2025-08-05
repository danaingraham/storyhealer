import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Debug: Fetching stories for user:", session.user.id);

    const stories = await prisma.story.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        title: true,
        createdAt: true,
        generationStatus: true,
        _count: {
          select: {
            pages: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`Debug: Found ${stories.length} stories`);
    for (const story of stories) {
      console.log(`- ${story.id}: "${story.title}" (${story._count.pages} pages)`);
    }

    return NextResponse.json({
      count: stories.length,
      stories: stories.map(story => ({
        id: story.id,
        title: story.title,
        createdAt: story.createdAt,
        generationStatus: story.generationStatus,
        pageCount: story._count.pages,
      }))
    });
  } catch (error) {
    console.error("Debug endpoint failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch story debug info" },
      { status: 500 }
    );
  }
}