import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findCorruptedData() {
  console.log('🔍 Looking for corrupted data in stories...');
  
  try {
    const stories = await prisma.story.findMany({
      include: {
        child: true,
        pages: true,
      }
    });

    console.log(`📚 Checking ${stories.length} stories...`);

    for (const story of stories) {
      console.log(`\n📖 Story: "${story.title}" (${story.pages.length} pages)`);
      
      // Check story fields for potential JSON issues
      const storyFields = {
        title: story.title,
        fearDescription: story.fearDescription,
        characterDescriptions: story.characterDescriptions,
        errorMessage: story.errorMessage
      };

      for (const [field, value] of Object.entries(storyFields)) {
        if (typeof value === 'string') {
          // Check for unescaped quotes or other problematic characters
          const hasUnescapedQuotes = value.includes('"') && !value.includes('\\"');
          const hasControlChars = /[\x00-\x1F\x7F]/.test(value);
          const isVeryLong = value.length > 10000;
          
          if (hasUnescapedQuotes || hasControlChars || isVeryLong) {
            console.log(`   ⚠️  ${field}: Potential issue`);
            console.log(`      - Length: ${value.length}`);
            console.log(`      - Unescaped quotes: ${hasUnescapedQuotes}`);
            console.log(`      - Control chars: ${hasControlChars}`);
            console.log(`      - Preview: "${value.substring(0, 100)}..."`);
          }
        }
      }

      // Check pages
      for (const page of story.pages) {
        const pageFields = {
          text: page.text,
          illustrationPrompt: page.illustrationPrompt
        };

        for (const [field, value] of Object.entries(pageFields)) {
          if (typeof value === 'string') {
            const hasUnescapedQuotes = value.includes('"') && !value.includes('\\"');
            const hasControlChars = /[\x00-\x1F\x7F]/.test(value);
            const isVeryLong = value.length > 50000; // Pages might legitimately be longer
            
            if (hasUnescapedQuotes || hasControlChars || isVeryLong) {
              console.log(`   ⚠️  Page ${page.pageNumber} ${field}: Potential issue`);
              console.log(`      - Length: ${value.length}`);
              console.log(`      - Unescaped quotes: ${hasUnescapedQuotes}`);
              console.log(`      - Control chars: ${hasControlChars}`);
              console.log(`      - Preview: "${value.substring(0, 100)}..."`);
              
              if (isVeryLong) {
                console.log(`      - Full content: ${JSON.stringify(value).length} chars when stringified`);
              }
            }
          }
        }
      }
    }

    // Also test JSON serialization
    console.log('\n🧪 Testing JSON serialization...');
    try {
      const jsonString = JSON.stringify(stories);
      console.log(`✅ JSON serialization successful: ${jsonString.length} characters`);
    } catch (error) {
      console.error('❌ JSON serialization failed:', error);
    }

  } catch (error) {
    console.error('❌ Search failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findCorruptedData();