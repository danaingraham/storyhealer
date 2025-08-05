import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invokeLLM, generateImage, generateStoryPrompt } from "@/lib/ai";

export async function GET() {
  const flow = {
    steps: [] as any[],
    errors: [] as string[],
  };

  try {
    // Step 1: Check authentication
    const session = await getServerSession(authOptions);
    flow.steps.push({
      step: "Authentication",
      success: !!session,
      userId: session?.user?.id,
    });

    if (!session?.user?.id) {
      flow.errors.push("Not authenticated");
      return NextResponse.json({ success: false, flow });
    }

    // Step 2: Create test child
    console.log("DEBUG FLOW: Creating test child...");
    const testChild = await prisma.child.create({
      data: {
        userId: session.user.id,
        name: "Test Child",
        age: 5,
        appearanceDescription: "A cheerful child with brown hair and bright eyes",
      },
    });
    flow.steps.push({
      step: "Create Child",
      success: true,
      childId: testChild.id,
    });

    // Step 3: Create test story
    console.log("DEBUG FLOW: Creating test story...");
    const testStory = await prisma.story.create({
      data: {
        userId: session.user.id,
        childId: testChild.id,
        title: "Test Story",
        fearDescription: "afraid of the dark",
        characterDescriptions: {},
      },
    });
    flow.steps.push({
      step: "Create Story",
      success: true,
      storyId: testStory.id,
    });

    // Step 4: Generate story content
    console.log("DEBUG FLOW: Generating story prompt...");
    const storyPrompt = generateStoryPrompt(
      testChild.name,
      testChild.age,
      "afraid of the dark",
      testChild.appearanceDescription
    );
    
    console.log("DEBUG FLOW: Calling LLM with prompt length:", storyPrompt.length);
    const llmResult = await invokeLLM(storyPrompt);
    
    if (llmResult.success) {
      console.log("DEBUG FLOW: LLM response received, parsing...");
      let storyData;
      
      try {
        if (typeof llmResult.data === 'string') {
          storyData = JSON.parse(llmResult.data);
        } else {
          storyData = llmResult.data;
        }
        
        flow.steps.push({
          step: "Generate Story Content",
          success: true,
          title: storyData.title,
          pages: storyData.pages?.length || 0,
        });

        // Step 5: Create story pages
        if (storyData.pages && Array.isArray(storyData.pages)) {
          console.log(`DEBUG FLOW: Creating ${storyData.pages.length} pages...`);
          
          for (const pageData of storyData.pages) {
            await prisma.storyPage.create({
              data: {
                storyId: testStory.id,
                pageNumber: pageData.page_number,
                text: pageData.text,
                illustrationPrompt: pageData.illustration_prompt,
              },
            });
          }
          
          flow.steps.push({
            step: "Create Pages",
            success: true,
            count: storyData.pages.length,
          });
        }
      } catch (parseError) {
        console.error("DEBUG FLOW: Parse error:", parseError);
        flow.errors.push(`Parse error: ${parseError}`);
        flow.steps.push({
          step: "Parse Story Data",
          success: false,
          error: parseError instanceof Error ? parseError.message : "Parse failed",
          rawData: llmResult.data,
        });
      }
    } else {
      flow.errors.push(`LLM error: ${llmResult.error}`);
      flow.steps.push({
        step: "Generate Story Content",
        success: false,
        error: llmResult.error,
      });
    }

    // Step 6: Test single image generation
    console.log("DEBUG FLOW: Testing image generation...");
    const imageResult = await generateImage("A child reading a book in a cozy bedroom with a nightlight");
    
    flow.steps.push({
      step: "Test Image Generation",
      success: imageResult.success,
      error: imageResult.error,
      hasUrl: !!imageResult.data?.url,
    });

    // Cleanup
    console.log("DEBUG FLOW: Cleaning up test data...");
    await prisma.storyPage.deleteMany({ where: { storyId: testStory.id } });
    await prisma.story.delete({ where: { id: testStory.id } });
    await prisma.child.delete({ where: { id: testChild.id } });

    return NextResponse.json({
      success: flow.errors.length === 0,
      flow,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("DEBUG FLOW: Fatal error:", error);
    flow.errors.push(`Fatal error: ${error instanceof Error ? error.message : "Unknown"}`);
    return NextResponse.json({
      success: false,
      flow,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}