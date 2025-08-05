import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateImage, generateIllustrationPrompt } from "@/lib/ai";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const storyId = id;

    // Verify story belongs to user
    const story = await prisma.story.findFirst({
      where: {
        id: storyId,
        userId: session.user.id,
      },
      include: {
        child: true,
        pages: {
          orderBy: { pageNumber: "asc" },
        },
      },
    });

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    console.log(`[ILLUSTRATIONS] === STARTING ILLUSTRATION GENERATION ===`);
    console.log(`[ILLUSTRATIONS] Story ID: ${storyId}`);
    console.log(`[ILLUSTRATIONS] Pages to generate: ${story.pages.length}`);
    console.log(`[ILLUSTRATIONS] Child: ${story.child.name}`);
    console.log(`[ILLUSTRATIONS] Appearance: ${story.child.appearanceDescription?.substring(0, 100)}...`);
    
    // Generate illustrations sequentially to avoid overwhelming the API
    for (const page of story.pages) {
      try {
        console.log(`[ILLUSTRATIONS] === PAGE ${page.pageNumber} ===`);
        console.log(`[ILLUSTRATIONS] Page text: ${page.text}`);
        console.log(`[ILLUSTRATIONS] Page illustration prompt: ${page.illustrationPrompt}`);
        
        const enhancedPrompt = generateIllustrationPrompt(
          page.illustrationPrompt,
          story.child.name,
          story.child.appearanceDescription,
          page.text
        );

        console.log(`[ILLUSTRATIONS] Enhanced prompt length: ${enhancedPrompt.length}`);
        console.log(`[ILLUSTRATIONS] Enhanced prompt preview: ${enhancedPrompt.substring(0, 150)}...`);
        console.log(`[ILLUSTRATIONS] Calling generateImage...`);

        const result = await generateImage(enhancedPrompt);

        if (result.success && result.data?.url) {
          console.log(`[ILLUSTRATIONS] Image generated successfully for page ${page.pageNumber}`);
          console.log(`[ILLUSTRATIONS] Image URL: ${result.data.url}`);
          
          try {
            await prisma.storyPage.update({
              where: { id: page.id },
              data: { illustrationUrl: result.data.url },
            });
            console.log(`[ILLUSTRATIONS] Database updated for page ${page.pageNumber}`);
          } catch (dbError) {
            console.error(`[ILLUSTRATIONS] Database update failed for page ${page.pageNumber}:`, dbError);
          }
        } else {
          console.error(`[ILLUSTRATIONS] Image generation failed for page ${page.pageNumber}:`, result.error);
          console.error(`[ILLUSTRATIONS] Full result:`, result);
        }
        
        // Add a small delay between requests to avoid rate limiting
        if (page.pageNumber < story.pages.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Error generating illustration for page ${page.pageNumber}:`, error);
        // Continue with next page even if one fails
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to generate illustrations:", error);
    return NextResponse.json(
      { error: "Failed to generate illustrations" },
      { status: 500 }
    );
  }
}