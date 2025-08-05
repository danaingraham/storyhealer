import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }
    
    // Mock file upload - return a fake URL
    const mockUrl = `https://mock-storage.example.com/uploads/${file.name}`;
    
    return NextResponse.json({
      url: mockUrl,
      filename: file.name,
      size: file.size,
      type: file.type
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Mock upload service error" },
      { status: 500 }
    );
  }
}