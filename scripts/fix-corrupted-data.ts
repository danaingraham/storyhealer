import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixCorruptedData() {
  console.log('🔧 Fixing corrupted data...');
  
  try {
    // Fix the illustration prompt with unescaped quotes
    console.log('1. Fixing illustration prompt with unescaped quotes...');
    
    const corruptedPage = await prisma.storyPage.findFirst({
      where: {
        illustrationPrompt: {
          contains: '{"prompt":'
        }
      }
    });
    
    if (corruptedPage) {
      console.log('   Found corrupted page:', corruptedPage.id);
      console.log('   Current prompt:', corruptedPage.illustrationPrompt.substring(0, 100) + '...');
      
      // Extract the actual prompt from the malformed JSON
      let cleanPrompt = corruptedPage.illustrationPrompt;
      
      // Try to extract the prompt value from the malformed JSON
      const match = cleanPrompt.match(/"prompt":"([^"]+)"/);
      if (match) {
        cleanPrompt = match[1];
        console.log('   Extracted clean prompt:', cleanPrompt);
        
        await prisma.storyPage.update({
          where: { id: corruptedPage.id },
          data: { illustrationPrompt: cleanPrompt }
        });
        
        console.log('   ✅ Fixed illustration prompt');
      }
    }
    
    // Fix the error message with HTML content
    console.log('2. Fixing error message with HTML content...');
    
    const errorStory = await prisma.story.findFirst({
      where: {
        errorMessage: {
          contains: '<!DOCTYPE html>'
        }
      }
    });
    
    if (errorStory) {
      console.log('   Found story with HTML error message:', errorStory.id);
      console.log('   Error message length:', errorStory.errorMessage?.length);
      
      // Replace with a clean error message
      await prisma.story.update({
        where: { id: errorStory.id },
        data: { 
          errorMessage: 'Story generation failed - please try creating a new story'
        }
      });
      
      console.log('   ✅ Fixed error message');
    }
    
    // Test JSON serialization again
    console.log('3. Testing JSON serialization after fixes...');
    const stories = await prisma.story.findMany({
      include: {
        child: true,
        pages: true,
      }
    });
    
    try {
      const jsonString = JSON.stringify(stories);
      console.log(`✅ JSON serialization successful: ${jsonString.length} characters`);
      console.log('🎉 Data corruption fixed!');
    } catch (error) {
      console.error('❌ JSON serialization still failing:', error);
    }

  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCorruptedData();