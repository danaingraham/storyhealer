import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; pageNumber: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id: storyId, pageNumber } = await params;
    const pageNum = parseInt(pageNumber);
    const userId = (session.user as any).id || session.user.email;

    console.log(`Deleting page ${pageNum} from story ${storyId}`);

    // Verify the user owns this story
    const story = await prisma.story.findFirst({
      where: {
        id: storyId,
        userId: userId,
      },
      include: {
        pages: {
          orderBy: { pageNumber: "asc" },
        },
      },
    });

    if (!story) {
      return new NextResponse("Story not found", { status: 404 });
    }

    // Don't allow deleting if only one page remains
    if (story.pages.length <= 1) {
      return new NextResponse("Cannot delete the last page of a story", { status: 400 });
    }

    // Find the page to delete
    const pageToDelete = story.pages.find(p => p.pageNumber === pageNum);
    if (!pageToDelete) {
      return new NextResponse("Page not found", { status: 404 });
    }

    console.log(`Found page to delete: ${pageToDelete.id}`);

    // Delete the page
    await prisma.storyPage.delete({
      where: { id: pageToDelete.id },
    });

    console.log(`Deleted page ${pageNum}`);

    // Renumber pages that come after the deleted page
    const pagesToRenumber = story.pages.filter(p => p.pageNumber > pageNum);
    console.log(`Renumbering ${pagesToRenumber.length} pages`);

    for (const page of pagesToRenumber) {
      await prisma.storyPage.update({
        where: { id: page.id },
        data: { pageNumber: page.pageNumber - 1 },
      });
      console.log(`Renumbered page ${page.pageNumber} to ${page.pageNumber - 1}`);
    }

    return NextResponse.json({
      success: true,
      deletedPage: pageNum,
      totalPages: story.pages.length - 1, // Subtract 1 for the deleted page
    });
  } catch (error) {
    console.error("Error deleting page:", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Failed to delete page",
      { status: 500 }
    );
  }
}