const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const SERVER_URL = 'http://localhost:3001/api';
const TEST_AUDIO_PATH = path.join(__dirname, 'uploads', 'anonymous', '1751101997116-c2fe09e0.mp3');

async function testDraftCreation() {
  try {
    console.log('🚀 Testing draft material creation...\n');

    // Шаг 1: Создаем черновик материала
    console.log('📝 Step 1: Creating draft material...');
    const draftResponse = await axios.post(`${SERVER_URL}/materials/draft`, {
      title: 'Test Draft Material',
      sourceLanguage: 'en',
      targetLanguage: ['ru', 'pl'],
      userId: 'anonymous'
    });

    if (!draftResponse.data.success) {
      throw new Error(`Failed to create draft: ${draftResponse.data.error}`);
    }

    const material = draftResponse.data.data;
    console.log(`✅ Draft created: ${material.id} (status: ${material.status})`);
    console.log(`✅ Title: ${material.title}`);
    console.log(`✅ Source language: ${material.sourceLanguage}`);
    console.log(`✅ Target languages: ${material.targetLanguage.join(', ')}`);

    // Шаг 2: Проверяем черновики
    console.log('\n📋 Step 2: Checking drafts...');
    const draftsResponse = await axios.get(`${SERVER_URL}/materials/drafts?userId=anonymous`);

    if (!draftsResponse.data.success) {
      throw new Error(`Failed to get drafts: ${draftsResponse.data.error}`);
    }

    const drafts = draftsResponse.data.data;
    console.log(`✅ Found ${drafts.length} drafts/processing materials`);
    
    drafts.forEach(draft => {
      console.log(`   - ${draft.id}: ${draft.title} (${draft.status})`);
    });

    // Шаг 3: Загружаем файл (без ожидания транскрипции)
    console.log('\n�� Step 3: Uploading file...');
    
    if (!fs.existsSync(TEST_AUDIO_PATH)) {
      console.log('⚠️  Test audio file not found, skipping file upload test');
      return;
    }

    const formData = new FormData();
    formData.append('audio', fs.createReadStream(TEST_AUDIO_PATH));

    const uploadResponse = await axios.put(
      `${SERVER_URL}/materials/${material.id}/upload-file`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 30000
      }
    );

    if (!uploadResponse.data.success) {
      throw new Error(`Failed to upload file: ${uploadResponse.data.error}`);
    }

    const uploadData = uploadResponse.data.data;
    console.log(`✅ File uploaded: ${uploadData.materialId} (predictionId: ${uploadData.predictionId})`);

    // Шаг 4: Проверяем статус материала после загрузки
    console.log('\n🔍 Step 4: Checking material status after upload...');
    const materialResponse = await axios.get(`${SERVER_URL}/materials/${material.id}`);

    if (!materialResponse.data.success) {
      throw new Error(`Failed to get material: ${materialResponse.data.error}`);
    }

    const updatedMaterial = materialResponse.data.data;
    console.log(`✅ Material status: ${updatedMaterial.status}`);
    console.log(`✅ Audio file: ${updatedMaterial.audioFileName}`);
    console.log(`✅ Transcription ID: ${updatedMaterial.transcriptionId}`);

    console.log('\n🎉 Draft creation test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Запускаем тест
testDraftCreation();
