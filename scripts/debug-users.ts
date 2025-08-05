import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugUsers() {
  console.log('🔍 Debugging user data in Neon...');
  
  try {
    const users = await prisma.user.findMany({
      include: {
        children: {
          include: {
            stories: {
              include: {
                pages: true
              }
            }
          }
        }
      }
    });
    
    console.log('\n👥 Users in database:');
    users.forEach(user => {
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Name: ${user.name}`);
      console.log(`   - Children: ${user.children.length}`);
      console.log(`   - Total Stories: ${user.children.reduce((acc, child) => acc + child.stories.length, 0)}`);
      
      user.children.forEach(child => {
        console.log(`     - Child: ${child.name} (${child.stories.length} stories)`);
        child.stories.forEach(story => {
          console.log(`       - Story: "${story.title}" (${story.pages.length} pages)`);
        });
      });
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugUsers();