import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixUserMapping() {
  console.log('🔧 Fixing user mapping for stories...');
  
  try {
    // Find the story you mentioned
    const targetStory = await prisma.story.findUnique({
      where: { id: 'cmds9dia2004bnli1hn0cnqx7' },
      include: {
        child: true,
        user: true
      }
    });
    
    if (!targetStory) {
      console.log('❌ Story not found in database');
      return;
    }
    
    console.log('📚 Found story:');
    console.log(`   - Title: "${targetStory.title}"`);
    console.log(`   - Current User ID: ${targetStory.userId}`);
    console.log(`   - Current User Email: ${targetStory.user.email}`);
    console.log(`   - Child: ${targetStory.child.name}`);
    
    // Find the current production user (the one with the same email but likely different ID)
    const allUsers = await prisma.user.findMany({
      where: { email: 'danabressler@gmail.com' }
    });
    
    console.log(`\n👥 Found ${allUsers.length} user(s) with your email:`);
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ID: ${user.id}, Created: ${user.createdAt}`);
    });
    
    if (allUsers.length > 1) {
      // Find the newer user (likely the production one)
      const newerUser = allUsers.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
      
      const olderUser = allUsers.find(u => u.id !== newerUser.id);
      
      console.log(`\n🔄 Will reassign stories from older user (${olderUser?.id}) to newer user (${newerUser.id})`);
      
      // Update all stories to belong to the newer user
      const updateResult = await prisma.story.updateMany({
        where: { userId: olderUser?.id },
        data: { userId: newerUser.id }
      });
      
      console.log(`✅ Updated ${updateResult.count} stories`);
      
      // Update all children to belong to the newer user
      const updateChildren = await prisma.child.updateMany({
        where: { userId: olderUser?.id },
        data: { userId: newerUser.id }
      });
      
      console.log(`✅ Updated ${updateChildren.count} children`);
      
      // Clean up the older user
      await prisma.user.delete({
        where: { id: olderUser?.id }
      });
      
      console.log(`✅ Removed duplicate user`);
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserMapping();