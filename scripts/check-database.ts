import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('🔍 Checking local database contents...');
  console.log('📍 Connected to:', process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'unknown');
  
  try {
    const userCount = await prisma.user.count();
    const childCount = await prisma.child.count();
    const storyCount = await prisma.story.count();
    const pageCount = await prisma.storyPage.count();
    
    console.log('\n📊 Database Contents:');
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Children: ${childCount}`);
    console.log(`   - Stories: ${storyCount}`);
    console.log(`   - Pages: ${pageCount}`);

    if (storyCount > 0) {
      console.log('\n📚 Stories found:');
      const stories = await prisma.story.findMany({
        include: {
          child: true,
          pages: true
        }
      });
      
      stories.forEach(story => {
        console.log(`   - "${story.title}" for ${story.child.name} (${story.pages.length} pages)`);
      });
    } else {
      console.log('\n❓ No stories found in this database');
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();