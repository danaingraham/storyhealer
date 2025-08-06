import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Get session info
    const session = await getServerSession(authOptions);
    
    // Test database connection
    let dbConnectionStatus = "unknown";
    let userCount = 0;
    let storyCount = 0;
    
    try {
      userCount = await prisma.user.count();
      dbConnectionStatus = "connected";
    } catch (dbError) {
      dbConnectionStatus = `error: ${dbError instanceof Error ? dbError.message : 'unknown error'}`;
    }

    if (session?.user?.id) {
      try {
        storyCount = await prisma.story.count({
          where: { userId: session.user.id }
        });
      } catch (storyError) {
        // Ignore story count error if user lookup fails
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      session: {
        exists: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id || null,
        userEmail: session?.user?.email || null,
        userName: session?.user?.name || null,
      },
      database: {
        connectionStatus: dbConnectionStatus,
        totalUsers: userCount,
        userStoryCount: storyCount,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDbUrl: !!process.env.DATABASE_URL,
        hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        nextAuthUrl: process.env.NEXTAUTH_URL,
      }
    });

  } catch (error) {
    return NextResponse.json({
      error: "Debug endpoint failed",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}