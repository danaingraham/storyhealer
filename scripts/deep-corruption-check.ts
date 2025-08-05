import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deepCorruptionCheck() {
  console.log('🔍 Deep corruption check...');
  
  try {
    const stories = await prisma.story.findMany({
      include: {
        child: true,
        pages: true,
      }
    });

    console.log(`📚 Checking ${stories.length} stories...`);

    for (let i = 0; i < stories.length; i++) {
      const story = stories[i];
      console.log(`\n📖 Story ${i + 1}: "${story.title}" (ID: ${story.id})`);
      
      // Test each story individually
      try {
        JSON.stringify(story);
        console.log('   ✅ Story serializes successfully');
      } catch (error) {
        console.log('   ❌ Story serialization failed:', error);
        
        // Test each field of the story
        const storyFields = {
          title: story.title,
          fearDescription: story.fearDescription,
          characterDescriptions: story.characterDescriptions,
          errorMessage: story.errorMessage,
          generationStatus: story.generationStatus,
          shareToken: story.shareToken
        };

        for (const [field, value] of Object.entries(storyFields)) {
          try {
            JSON.stringify(value);
          } catch (fieldError) {
            console.log(`      - Field "${field}" failed: ${fieldError}`);
            console.log(`      - Value preview: ${JSON.stringify(String(value).substring(0, 100))}`);
          }
        }

        // Test child data
        try {
          JSON.stringify(story.child);
        } catch (childError) {
          console.log(`      - Child data failed: ${childError}`);
        }

        // Test each page
        for (let j = 0; j < story.pages.length; j++) {
          const page = story.pages[j];
          try {
            JSON.stringify(page);
          } catch (pageError) {
            console.log(`      - Page ${page.pageNumber} failed: ${pageError}`);
            
            // Test each page field
            const pageFields = {
              text: page.text,
              illustrationPrompt: page.illustrationPrompt,
              charactersInScene: page.charactersInScene
            };

            for (const [field, value] of Object.entries(pageFields)) {
              try {
                JSON.stringify(value);
              } catch (fieldError) {
                console.log(`        - Page field "${field}" failed: ${fieldError}`);
                console.log(`        - Value preview: ${JSON.stringify(String(value).substring(0, 100))}`);
              }
            }
          }
        }
      }
    }

    // Test full serialization
    console.log('\n🧪 Testing full serialization...');
    try {
      const jsonString = JSON.stringify(stories);
      console.log(`✅ Full serialization successful: ${jsonString.length} characters`);
    } catch (error) {
      console.error('❌ Full serialization failed:', error);
    }

  } catch (error) {
    console.error('❌ Deep check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deepCorruptionCheck();