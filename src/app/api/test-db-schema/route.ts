import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Try to get a sample story page and see its structure
    const samplePage = await prisma.storyPage.findFirst();
    
    let hasUserUploadedImageUrl = false;
    let pageStructure = null;
    
    if (samplePage) {
      pageStructure = Object.keys(samplePage);
      hasUserUploadedImageUrl = 'userUploadedImageUrl' in samplePage;
    }

    // Try to create a test query with the field
    let fieldTestPassed = false;
    try {
      const testPages = await prisma.storyPage.findMany({
        take: 1,
        select: {
          id: true,
          userUploadedImageUrl: true
        }
      });
      fieldTestPassed = true;
    } catch (error) {
      console.log("Field test failed:", error);
      fieldTestPassed = false;
    }

    return NextResponse.json({
      status: "success",
      hasUserUploadedImageUrlField: hasUserUploadedImageUrl,
      fieldTestPassed: fieldTestPassed,
      samplePageStructure: pageStructure,
      message: hasUserUploadedImageUrl 
        ? "Database schema is up to date!" 
        : "Database migration needed - userUploadedImageUrl field is missing. Please run: npx prisma migrate dev"
    });
  } catch (error) {
    console.error("Database test error:", error);
    return NextResponse.json({
      status: "error",
      message: "Failed to check database schema",
      error: error instanceof Error ? error.message : "Unknown error",
      hint: "Make sure you've run: npx prisma generate"
    });
  }
}