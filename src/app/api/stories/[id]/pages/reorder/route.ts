import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pageOrder } = await request.json();
    const { id: storyId } = await params;
    const userId = (session.user as any).id || session.user.email;

    console.log(`[REORDER] Reordering pages for story ${storyId}, user ${userId}`);
    console.log(`[REORDER] Received pageOrder:`, pageOrder);
    console.log(`[REORDER] New order:`, pageOrder.map((p: any) => `${p.id}:${p.pageNumber}`));

    // Verify story belongs to user
    const story = await prisma.story.findFirst({
      where: {
        id: storyId,
        userId: userId,
      },
      include: {
        pages: true,
      },
    });

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    // Validate that all page IDs belong to this story
    const storyPageIds = new Set(story.pages.map(p => p.id));
    const providedPageIds = new Set(pageOrder.map((p: any) => p.id));
    
    if (storyPageIds.size !== providedPageIds.size || 
        !Array.from(storyPageIds).every(id => providedPageIds.has(id))) {
      return NextResponse.json({ error: "Invalid page IDs provided" }, { status: 400 });
    }

    // Update page numbers in a transaction
    console.log(`[REORDER] Starting transaction to update ${pageOrder.length} pages`);
    
    await prisma.$transaction(async (tx) => {
      console.log(`[REORDER] Step 1: Setting all pages to unique temporary numbers`);
      
      // First, set each page to a unique temporary negative number to avoid constraint violations
      const currentPages = await tx.storyPage.findMany({
        where: { storyId },
        select: { id: true, pageNumber: true }
      });
      
      for (let i = 0; i < currentPages.length; i++) {
        const page = currentPages[i];
        const tempPageNumber = -(i + 1000); // Use large negative numbers to avoid conflicts
        await tx.storyPage.update({
          where: { id: page.id },
          data: { pageNumber: tempPageNumber }
        });
      }
      console.log(`[REORDER] Set ${currentPages.length} pages to temporary numbers`);

      // Then update each page to its new number
      console.log(`[REORDER] Step 2: Updating each page to new number`);
      for (let i = 0; i < pageOrder.length; i++) {
        const page = pageOrder[i];
        console.log(`[REORDER] Updating page ${page.id} to pageNumber ${i + 1}`);
        
        const updateResult = await tx.storyPage.update({
          where: { id: page.id },
          data: { pageNumber: i + 1 }
        });
        console.log(`[REORDER] Updated page ${page.id}:`, updateResult.pageNumber);
      }
      
      console.log(`[REORDER] Transaction completed successfully`);
    });

    console.log(`[REORDER] Successfully reordered ${pageOrder.length} pages`);

    return NextResponse.json({ 
      success: true, 
      message: "Pages reordered successfully",
      totalPages: pageOrder.length
    });

  } catch (error) {
    console.error("Failed to reorder pages:", error);
    console.error("Error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        error: "Failed to reorder pages", 
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}