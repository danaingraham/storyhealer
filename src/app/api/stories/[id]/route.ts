import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    const story = await prisma.story.findFirst({
      where: {
        id,
        ...(session?.user?.id ? { userId: session.user.id } : {}),
      },
      include: {
        child: true,
        pages: {
          orderBy: { pageNumber: "asc" },
        },
        conversations: {
          orderBy: { pageNumber: "asc" },
        },
      },
    });

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    // If no session, only allow access if story has a share token in the URL
    if (!session?.user?.id) {
      const { searchParams } = new URL(request.url);
      const shareToken = searchParams.get("token");
      
      if (!shareToken || story.shareToken !== shareToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    console.log(`[STORY-GET] Returning story ${id} with ${story.pages.length} pages`);
    console.log(`[STORY-GET] Page texts:`, story.pages.map(p => `Page ${p.pageNumber}: "${p.text?.substring(0, 50)}..."`));
    
    const response = NextResponse.json(story);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error("Failed to fetch story:", error);
    return NextResponse.json(
      { error: "Failed to fetch story" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

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

    // Delete story and related records (cascade)
    await prisma.story.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete story:", error);
    return NextResponse.json(
      { error: "Failed to delete story" },
      { status: 500 }
    );
  }
}