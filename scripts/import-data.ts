import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function importData() {
  console.log('🔄 Importing data to Neon database...');
  console.log('📍 Connected to:', process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'unknown');
  
  try {
    // Read export file
    const exportPath = path.join(process.cwd(), 'data-export.json');
    const exportData = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
    
    console.log('📊 Import Summary:');
    console.log(`   - Users to import: ${exportData.totalUsers}`);
    console.log(`   - Children to import: ${exportData.totalChildren}`);
    console.log(`   - Stories to import: ${exportData.totalStories}`);
    
    // Import each user and their data
    for (const userData of exportData.users) {
      console.log(`\n👤 Processing user: ${userData.email}`);
      
      // Check if user already exists (by email)
      let user = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      
      if (user) {
        console.log('   ✅ User already exists, updating...');
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            name: userData.name,
            image: userData.image,
            emailVerified: userData.emailVerified ? new Date(userData.emailVerified) : null
          }
        });
      } else {
        console.log('   ➕ Creating new user...');
        user = await prisma.user.create({
          data: {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            image: userData.image,
            emailVerified: userData.emailVerified ? new Date(userData.emailVerified) : null,
            createdAt: new Date(userData.createdAt),
            updatedAt: new Date(userData.updatedAt)
          }
        });
      }
      
      // Import children
      for (const childData of userData.children) {
        console.log(`   👶 Processing child: ${childData.name}`);
        
        // Check if child already exists
        let child = await prisma.child.findUnique({
          where: { id: childData.id }
        });
        
        if (child) {
          console.log('     ✅ Child already exists, updating...');
          child = await prisma.child.update({
            where: { id: child.id },
            data: {
              name: childData.name,
              age: childData.age,
              gender: childData.gender,
              hairColor: childData.hairColor,
              photoUrl: childData.photoUrl,
              appearanceDescription: childData.appearanceDescription,
              updatedAt: new Date(childData.updatedAt)
            }
          });
        } else {
          console.log('     ➕ Creating new child...');
          child = await prisma.child.create({
            data: {
              id: childData.id,
              userId: user.id,
              name: childData.name,
              age: childData.age,
              gender: childData.gender,
              hairColor: childData.hairColor,
              photoUrl: childData.photoUrl,
              appearanceDescription: childData.appearanceDescription,
              createdAt: new Date(childData.createdAt),
              updatedAt: new Date(childData.updatedAt)
            }
          });
        }
        
        // Import stories
        for (const storyData of childData.stories) {
          console.log(`     📚 Processing story: "${storyData.title}"`);
          
          // Check if story already exists
          let story = await prisma.story.findUnique({
            where: { id: storyData.id }
          });
          
          if (story) {
            console.log('       ✅ Story already exists, skipping...');
            continue;
          }
          
          console.log('       ➕ Creating new story...');
          story = await prisma.story.create({
            data: {
              id: storyData.id,
              userId: user.id,
              childId: child.id,
              title: storyData.title,
              fearDescription: storyData.fearDescription,
              characterDescriptions: storyData.characterDescriptions,
              generationStatus: storyData.generationStatus,
              errorMessage: storyData.errorMessage,
              shareToken: storyData.shareToken,
              createdAt: new Date(storyData.createdAt),
              updatedAt: new Date(storyData.updatedAt)
            }
          });
          
          // Import pages
          for (const pageData of storyData.pages) {
            console.log(`         📄 Creating page ${pageData.pageNumber}...`);
            
            await prisma.storyPage.create({
              data: {
                id: pageData.id,
                storyId: story.id,
                pageNumber: pageData.pageNumber,
                text: pageData.text,
                illustrationUrl: pageData.illustrationUrl,
                illustrationPrompt: pageData.illustrationPrompt,
                charactersInScene: pageData.charactersInScene,
                userUploadedImageUrl: pageData.userUploadedImageUrl,
                createdAt: new Date(pageData.createdAt),
                updatedAt: new Date(pageData.updatedAt)
              }
            });
          }
          
          // Import conversations
          for (const convData of storyData.conversations) {
            console.log(`         💬 Creating conversation for page ${convData.pageNumber}...`);
            
            await prisma.pageConversation.create({
              data: {
                id: convData.id,
                storyId: story.id,
                pageNumber: convData.pageNumber,
                messages: convData.messages,
                createdAt: new Date(convData.createdAt),
                updatedAt: new Date(convData.updatedAt)
              }
            });
          }
        }
      }
    }
    
    console.log('\n✅ Import completed successfully!');
    
    // Verify import
    const finalCount = await prisma.story.count();
    console.log(`📊 Final story count: ${finalCount}`);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importData();