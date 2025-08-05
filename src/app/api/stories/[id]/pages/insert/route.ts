import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invokeLLM, generateImage, generateIllustrationPrompt } from "@/lib/ai";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { position, pageNumber } = await request.json();
    const { id: storyId } = await params;
    const userId = (session.user as any).id || session.user.email;

    // Verify the user owns this story
    const story = await prisma.story.findFirst({
      where: {
        id: storyId,
        userId: userId,
      },
      include: {
        child: true,
        pages: {
          orderBy: { pageNumber: "asc" },
        },
      },
    });

    if (!story) {
      return new NextResponse("Story not found", { status: 404 });
    }

    // Calculate the new page number
    const insertAtNumber = position === "before" ? pageNumber : pageNumber + 1;
    
    console.log(`Inserting ${position} page ${pageNumber}, new page will be at position ${insertAtNumber}`);

    // Update page numbers for existing pages that need to shift
    // We need to do this in descending order to avoid unique constraint violations
    const pagesToUpdate = await prisma.storyPage.findMany({
      where: {
        storyId,
        pageNumber: { gte: insertAtNumber },
      },
      orderBy: { pageNumber: 'desc' },
    });

    console.log(`Found ${pagesToUpdate.length} pages to renumber`);

    // Update pages one by one in descending order
    for (const page of pagesToUpdate) {
      await prisma.storyPage.update({
        where: { id: page.id },
        data: { pageNumber: page.pageNumber + 1 },
      });
      console.log(`Updated page ${page.pageNumber} to ${page.pageNumber + 1}`);
    }

    // Get context from surrounding pages (accounting for the fact that pages will be renumbered)
    let prevPage, nextPage;
    
    if (position === "before") {
      prevPage = story.pages.find(p => p.pageNumber === pageNumber - 1);
      nextPage = story.pages.find(p => p.pageNumber === pageNumber);
    } else {
      prevPage = story.pages.find(p => p.pageNumber === pageNumber);
      nextPage = story.pages.find(p => p.pageNumber === pageNumber + 1);
    }
    
    console.log("Context pages:", { 
      prevPage: prevPage?.pageNumber || "none", 
      nextPage: nextPage?.pageNumber || "none" 
    });
    
    // Generate content for the new page
    const prompt = `
      You are helping to insert a new page into a children's story about ${story.child.name} overcoming their fear of ${story.fearDescription}.
      
      Character: ${story.child.name} - ${story.child.appearanceDescription}
      Story Title: ${story.title}
      
      ${prevPage ? `Previous page text: "${prevPage.text}"` : "This will be the first page of the story."}
      ${nextPage ? `Next page text: "${nextPage.text}"` : "This will be the last page of the story."}
      
      Create a new page that fits naturally ${position === "before" && pageNumber === 1 ? "as the opening of the story" : "between these pages"}. The text should:
      - Be 2-3 sentences (30-50 words)
      - ${position === "before" && pageNumber === 1 ? "Introduce the story and character" : "Flow smoothly from the previous page to the next page"}
      - Continue the story progression about overcoming fear of ${story.fearDescription}
      - Be age-appropriate for a ${story.child.age}-year-old
      
      Return JSON with this format:
      {
        "text": "The new page text...",
        "illustrationPrompt": "Detailed description for the illustration...",
        "charactersInScene": ["${story.child.name}"]
      }
    `;

    console.log("Calling LLM to generate page content...");
    const result = await invokeLLM(prompt);
    
    if (!result.success) {
      console.error("LLM failed:", result.error);
      throw new Error(`Failed to generate page content: ${result.error}`);
    }

    let pageData;
    try {
      pageData = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;
      console.log("Generated page data:", pageData);
    } catch (e) {
      console.error("Failed to parse LLM response:", result.data);
      throw new Error("Failed to parse generated content");
    }

    // Generate illustration
    console.log("Generating illustration...");
    const enhancedPrompt = generateIllustrationPrompt(
      pageData.illustrationPrompt,
      story.child.name,
      story.child.appearanceDescription,
      pageData.text
    );

    const imageResult = await generateImage(enhancedPrompt);
    console.log("Image generation result:", imageResult.success ? "success" : imageResult.error);

    // Create the new page
    console.log(`Creating new page at position ${insertAtNumber}`);
    const newPage = await prisma.storyPage.create({
      data: {
        storyId,
        pageNumber: insertAtNumber,
        text: pageData.text,
        illustrationPrompt: pageData.illustrationPrompt,
        illustrationUrl: imageResult.success ? imageResult.data?.url : null,
        charactersInScene: pageData.charactersInScene || [story.child.name],
      },
    });
    
    console.log("Successfully created new page:", newPage.id);

    return NextResponse.json({
      success: true,
      page: newPage,
      totalPages: story.pages.length + 1,
    });
  } catch (error) {
    console.error("Error inserting page:", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Failed to insert page",
      { status: 500 }
    );
  }
}