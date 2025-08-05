import { NextResponse } from "next/server";
import { invokeLLM, generateStoryPrompt } from "@/lib/ai";

export async function GET() {
  const results = {
    storyPromptGeneration: false,
    llmCall: false,
    jsonParsing: false,
    errors: [] as string[],
    rawData: null as any,
  };

  try {
    // Test story prompt generation
    console.log("DEBUG: Testing story prompt generation...");
    const testPrompt = generateStoryPrompt(
      "Alex",
      5,
      "afraid of the dark",
      "A cheerful child with brown hair and bright eyes"
    );
    
    results.storyPromptGeneration = true;
    console.log(`DEBUG: Generated prompt length: ${testPrompt.length}`);
    console.log(`DEBUG: Prompt preview: ${testPrompt.substring(0, 200)}...`);

    // Test LLM call
    console.log("DEBUG: Testing LLM call...");
    const llmResult = await invokeLLM(testPrompt);
    
    if (llmResult.success) {
      results.llmCall = true;
      results.rawData = llmResult.data;
      console.log("DEBUG: LLM succeeded");
      console.log(`DEBUG: Response type: ${typeof llmResult.data}`);
      console.log(`DEBUG: Response preview: ${JSON.stringify(llmResult.data).substring(0, 300)}...`);
      
      // Test JSON parsing
      try {
        let parsedData;
        if (typeof llmResult.data === 'string') {
          parsedData = JSON.parse(llmResult.data);
        } else {
          parsedData = llmResult.data;
        }
        
        results.jsonParsing = true;
        console.log("DEBUG: JSON parsing succeeded");
        console.log("DEBUG: Parsed structure:", {
          hasTitle: !!parsedData.title,
          hasPages: !!parsedData.pages,
          pageCount: parsedData.pages?.length || 0,
          firstPageStructure: parsedData.pages?.[0] ? Object.keys(parsedData.pages[0]) : null
        });
        
      } catch (parseError) {
        results.errors.push(`JSON parsing failed: ${parseError}`);
        console.error("DEBUG: JSON parsing failed:", parseError);
      }
      
    } else {
      results.errors.push(`LLM failed: ${llmResult.error}`);
      console.error("DEBUG: LLM failed:", llmResult.error);
    }

    return NextResponse.json({
      success: results.storyPromptGeneration && results.llmCall && results.jsonParsing,
      results,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error("DEBUG: Test error:", error);
    results.errors.push(`Fatal error: ${error instanceof Error ? error.message : "Unknown"}`);
    
    return NextResponse.json({
      success: false,
      results,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}