const axios = require('axios');

const SERVER_URL = 'http://localhost:3001/api';

async function testSimpleDraft() {
  try {
    console.log('🚀 Testing simple draft creation...\n');

    // Проверяем, что сервер работает
    console.log('🔍 Checking server health...');
    const healthResponse = await axios.get(`${SERVER_URL.replace('/api', '')}/health`);
    console.log('✅ Server is running');

    // Создаем черновик материала
    console.log('\n📝 Creating draft material...');
    const draftResponse = await axios.post(`${SERVER_URL}/materials/draft`, {
      title: 'Simple Test Draft',
      sourceLanguage: 'en',
      targetLanguage: ['ru'],
      userId: 'anonymous'
    });

    console.log('✅ Draft created successfully');
    console.log(`�� Material ID: ${draftResponse.data.data.id}`);
    console.log(`📊 Status: ${draftResponse.data.data.status}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Запускаем тест
testSimpleDraft();
