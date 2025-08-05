import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; pageNumber: string } }
) {
  try {
    console.log("Upload image API called with params:", params);
    
    const session = await getServerSession(authOptions);
    console.log("Session:", session);
    
    if (!session || !session.user) {
      console.error("No session or user found");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id: storyId, pageNumber } = await params;
    const pageNum = parseInt(pageNumber);
    console.log("Story ID:", storyId, "Page Number:", pageNum);

    // Verify the user owns this story
    const userId = (session.user as any).id || session.user.email;
    console.log("User ID:", userId);
    
    const story = await prisma.story.findFirst({
      where: {
        id: storyId,
        userId: userId,
      },
    });

    if (!story) {
      console.error("Story not found for user:", userId, "Story ID:", storyId);
      return new NextResponse("Story not found", { status: 404 });
    }
    console.log("Story found:", story.id);

    // Get the image data from the request
    const formData = await request.formData();
    const imageFile = formData.get("image") as File;
    
    if (!imageFile) {
      return new NextResponse("No image provided", { status: 400 });
    }

    // Convert to base64 for storage (in production, you'd upload to a service like S3)
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${imageFile.type};base64,${buffer.toString("base64")}`;

    // Update the story page with the uploaded image
    const updatedPage = await prisma.storyPage.update({
      where: {
        storyId_pageNumber: {
          storyId,
          pageNumber: pageNum,
        },
      },
      data: {
        userUploadedImageUrl: base64,
      },
    });

    return NextResponse.json({ 
      success: true, 
      userUploadedImageUrl: updatedPage.userUploadedImageUrl 
    });
  } catch (error) {
    console.error("Error uploading page image:", error);
    console.error("Error details:", error instanceof Error ? error.message : error);
    
    if (error instanceof Error && error.message.includes('userUploadedImageUrl')) {
      return new NextResponse("Database schema error - userUploadedImageUrl field might be missing", { status: 500 });
    }
    
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Server Error", 
      { status: 500 }
    );
  }
}

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

    // Remove the uploaded image
    await prisma.storyPage.update({
      where: {
        storyId_pageNumber: {
          storyId,
          pageNumber: pageNum,
        },
      },
      data: {
        userUploadedImageUrl: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting page image:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}