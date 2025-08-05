import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkStoryPages() {
  try {
    // Get the most recent story
    const recentStory = await prisma.story.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        pages: {
          orderBy: { pageNumber: 'asc' }
        },
        child: true
      }
    });

    if (!recentStory) {
      console.log("No stories found");
      return;
    }

    console.log("=== MOST RECENT STORY ===");
    console.log(`ID: ${recentStory.id}`);
    console.log(`Title: ${recentStory.title}`);
    console.log(`Status: ${recentStory.generationStatus}`);
    console.log(`Child: ${recentStory.child.name}`);
    console.log(`Created: ${recentStory.createdAt}`);
    console.log(`Pages Count: ${recentStory.pages.length}`);
    
    if (recentStory.pages.length === 0) {
      console.log("❌ NO PAGES FOUND - This is the problem!");
    } else {
      console.log("\n=== PAGES ===");
      recentStory.pages.forEach(page => {
        console.log(`Page ${page.pageNumber}:`);
        console.log(`  Text: ${page.text?.substring(0, 100)}...`);
        console.log(`  Has illustration prompt: ${!!page.illustrationPrompt}`);
        console.log(`  Has user image: ${!!page.userUploadedImageUrl}`);
        console.log(`  Has AI image: ${!!page.illustrationUrl}`);
        console.log("");
      });
    }

    // Also check any failed stories
    const failedStories = await prisma.story.findMany({
      where: { generationStatus: 'ERROR' },
      orderBy: { createdAt: 'desc' },
      take: 3
    });

    if (failedStories.length > 0) {
      console.log("\n=== RECENT FAILED STORIES ===");
      failedStories.forEach(story => {
        console.log(`${story.id}: ${story.title || 'No title'} - ${story.createdAt}`);
      });
    }

  } catch (error) {
    console.error("Error checking story pages:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStoryPages();