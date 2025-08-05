import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    // Mock image generation - return different placeholder images based on prompt
    const mockImageUrls = [
      "https://picsum.photos/400/400?random=1",
      "https://picsum.photos/400/400?random=2", 
      "https://picsum.photos/400/400?random=3",
      "https://picsum.photos/400/400?random=4",
      "https://picsum.photos/400/400?random=5",
      "https://picsum.photos/400/400?random=6"
    ];
    
    // Simple hash function to consistently return the same image for the same prompt
    const hash = prompt.split('').reduce((a: number, b: string) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const imageIndex = Math.abs(hash) % mockImageUrls.length;
    
    return NextResponse.json({
      url: mockImageUrls[imageIndex],
      prompt: prompt
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Mock image service error" },
      { status: 500 }
    );
  }
}