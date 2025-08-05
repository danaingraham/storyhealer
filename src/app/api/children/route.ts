import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log("Children API: Session:", session?.user?.id ? "Authenticated" : "Not authenticated");
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("Children API: Received data:", { 
      name: body.name, 
      age: body.age, 
      hasAppearanceDescription: !!body.appearanceDescription 
    });
    
    const { name, age, gender, hairColor, photoUrl, appearanceDescription } = body;

    if (!name || !age || !appearanceDescription) {
      console.error("Children API: Missing required fields");
      return NextResponse.json(
        { error: "Name, age, and appearance description are required" },
        { status: 400 }
      );
    }

    console.log("Children API: Creating child in database...");
    const child = await prisma.child.create({
      data: {
        userId: session.user.id,
        name,
        age: parseInt(age),
        gender,
        hairColor,
        photoUrl,
        appearanceDescription,
      },
    });
    console.log("Children API: Child created successfully with ID:", child.id);

    return NextResponse.json(child);
  } catch (error) {
    console.error("Children API: Failed to create child:", error);
    console.error("Children API: Error details:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: `Failed to create child: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const children = await prisma.child.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(children);
  } catch (error) {
    console.error("Failed to fetch children:", error);
    return NextResponse.json(
      { error: "Failed to fetch children" },
      { status: 500 }
    );
  }
}