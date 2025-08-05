import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function exportData() {
  console.log('🔄 Exporting data from local database...');
  
  try {
    // Export all data
    const users = await prisma.user.findMany({
      include: {
        children: {
          include: {
            stories: {
              include: {
                pages: {
                  orderBy: { pageNumber: 'asc' }
                },
                conversations: {
                  orderBy: { pageNumber: 'asc' }
                }
              }
            }
          }
        }
      }
    });

    const exportData = {
      users,
      exportedAt: new Date().toISOString(),
      totalUsers: users.length,
      totalChildren: users.reduce((acc, user) => acc + user.children.length, 0),
      totalStories: users.reduce((acc, user) => 
        acc + user.children.reduce((acc2, child) => acc2 + child.stories.length, 0), 0
      )
    };

    // Save to file
    const exportPath = path.join(process.cwd(), 'data-export.json');
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    
    console.log('✅ Export completed!');
    console.log('📊 Export Summary:');
    console.log(`   - Users: ${exportData.totalUsers}`);
    console.log(`   - Children: ${exportData.totalChildren}`);
    console.log(`   - Stories: ${exportData.totalStories}`);
    console.log(`   - File: ${exportPath}`);
    
  } catch (error) {
    console.error('❌ Export failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();