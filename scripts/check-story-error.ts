import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkStoryError() {
  try {
    // Get the most recent failed story
    const failedStory = await prisma.story.findFirst({
      where: { generationStatus: 'ERROR' },
      orderBy: { createdAt: 'desc' },
      include: {
        child: true
      }
    });

    if (!failedStory) {
      console.log("No failed stories found");
      return;
    }

    console.log("=== MOST RECENT FAILED STORY ===");
    console.log(`ID: ${failedStory.id}`);
    console.log(`Title: ${failedStory.title}`);
    console.log(`Child: ${failedStory.child.name} (age ${failedStory.child.age})`);
    console.log(`Fear: ${failedStory.fearDescription}`);
    console.log(`Error Message: ${failedStory.errorMessage || 'No error message stored'}`);
    console.log(`Created: ${failedStory.createdAt}`);
    console.log(`Character Descriptions:`, failedStory.characterDescriptions);

    // Let's also check if there are any successful stories recently
    const successStory = await prisma.story.findFirst({
      where: { generationStatus: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
      include: {
        pages: true
      }
    });

    if (successStory) {
      console.log("\n=== MOST RECENT SUCCESS ===");
      console.log(`ID: ${successStory.id}`);
      console.log(`Title: ${successStory.title}`);
      console.log(`Pages: ${successStory.pages.length}`);
      console.log(`Created: ${successStory.createdAt}`);
    } else {
      console.log("\n❌ NO SUCCESSFUL STORIES FOUND RECENTLY");
    }

  } catch (error) {
    console.error("Error checking story error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStoryError();