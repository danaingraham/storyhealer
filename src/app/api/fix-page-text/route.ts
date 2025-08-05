import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { storyId, pageNumber } = await request.json();
    const userId = (session.user as any).id || session.user.email;

    // Verify the user owns this story
    const story = await prisma.story.findFirst({
      where: {
        id: storyId,
        userId: userId,
      },
    });

    if (!story) {
      return new NextResponse("Story not found", { status: 404 });
    }

    // Fix the corrupted page text with a default message
    await prisma.storyPage.update({
      where: {
        storyId_pageNumber: {
          storyId,
          pageNumber: parseInt(pageNumber),
        },
      },
      data: {
        text: "This page text was corrupted. Please use the AI editor to rewrite it.",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error fixing page text:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}