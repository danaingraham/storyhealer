import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { analyzePhoto } from "@/lib/ai";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const photo = formData.get("photo") as File;

    if (!photo) {
      return NextResponse.json(
        { error: "Photo is required" },
        { status: 400 }
      );
    }

    // Convert file to base64 for AI analysis
    const bytes = await photo.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${photo.type};base64,${base64}`;

    const result = await analyzePhoto(dataUrl);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to analyze photo" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      description: result.data?.description || result.data,
    });
  } catch (error) {
    console.error("Photo analysis failed:", error);
    return NextResponse.json(
      { error: "Failed to analyze photo" },
      { status: 500 }
    );
  }
}