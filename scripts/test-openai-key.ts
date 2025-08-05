// Test OpenAI API key
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });
config({ path: '.env.local' });

async function testOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  console.log('API Key found:', !!apiKey);
  console.log('API Key prefix:', apiKey?.substring(0, 20) + '...');
  
  if (!apiKey) {
    console.error('No API key found in environment');
    return;
  }

  try {
    console.log('Testing OpenAI API...');
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      console.log('✅ OpenAI API key is valid');
      const data = await response.json();
      console.log(`Available models: ${data.data?.length || 0}`);
    } else {
      console.log('❌ OpenAI API key is invalid');
      console.log('Status:', response.status);
      console.log('Response:', await response.text());
    }
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testOpenAI();