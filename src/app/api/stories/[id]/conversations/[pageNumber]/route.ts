import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; pageNumber: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, pageNumber: pageNumberParam } = await params;
    const pageNumber = parseInt(pageNumberParam);

    // Verify story belongs to user
    const story = await prisma.story.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    const conversation = await prisma.pageConversation.findUnique({
      where: {
        storyId_pageNumber: {
          storyId: id,
          pageNumber,
        },
      },
    });

    return NextResponse.json({
      messages: conversation?.messages || [],
    });
  } catch (error) {
    console.error("Failed to fetch conversation:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; pageNumber: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages } = await request.json();
    const { id, pageNumber: pageNumberParam } = await params;
    const pageNumber = parseInt(pageNumberParam);

    // Verify story belongs to user
    const story = await prisma.story.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    await prisma.pageConversation.upsert({
      where: {
        storyId_pageNumber: {
          storyId: id,
          pageNumber,
        },
      },
      update: {
        messages,
        updatedAt: new Date(),
      },
      create: {
        storyId: id,
        pageNumber,
        messages,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save conversation:", error);
    return NextResponse.json(
      { error: "Failed to save conversation" },
      { status: 500 }
    );
  }
}