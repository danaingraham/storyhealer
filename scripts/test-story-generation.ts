// Test story generation API
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });
config({ path: '.env.local' });

async function testStoryGeneration() {
  try {
    console.log('Testing story generation...');
    
    const response = await fetch('http://localhost:3000/api/stories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        childId: 'cmdyxqwxz0003jiyzthyz99sw', // Use an existing child ID
        fearDescription: 'Swimming'
      })
    });

    console.log('Response status:', response.status);
    
    if (response.ok) {
      const story = await response.json();
      console.log('✅ Story generation successful!');
      console.log('Story ID:', story.id);
      console.log('Title:', story.title);
    } else {
      console.log('❌ Story generation failed');
      const errorText = await response.text();
      console.log('Error:', errorText);
    }
  } catch (error) {
    console.error('Error testing story generation:', error);
  }
}

testStoryGeneration();