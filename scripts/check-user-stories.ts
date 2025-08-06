import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkUserStories() {
  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      }
    });

    console.log("=== USERS IN DATABASE ===");
    users.forEach(user => {
      console.log(`ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Name: ${user.name}`);
      console.log(`Created: ${user.createdAt}`);
      console.log("---");
    });

    // Get all stories with their user info
    const stories = await prisma.story.findMany({
      include: {
        user: {
          select: { id: true, email: true, name: true }
        },
        child: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log("\n=== RECENT STORIES WITH USER INFO ===");
    stories.forEach(story => {
      console.log(`Story: ${story.title}`);
      console.log(`Story ID: ${story.id}`);
      console.log(`User ID: ${story.userId}`);
      console.log(`User Email: ${story.user.email}`);
      console.log(`User Name: ${story.user.name}`);
      console.log(`Child: ${story.child.name}`);
      console.log(`Status: ${story.generationStatus}`);
      console.log(`Created: ${story.createdAt}`);
      console.log("---");
    });

    // Skip orphaned stories check for now to avoid TypeScript issues in build

  } catch (error) {
    console.error("Error checking user stories:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserStories();