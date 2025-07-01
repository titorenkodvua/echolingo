const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3001/api';
const TEST_AUDIO_PATH = path.join(__dirname, 'uploads', 'anonymous', '1751101997116-c2fe09e0.mp3');

async function testNewPipeline() {
  console.log('🧪 Testing new material creation pipeline...\n');

  try {
    // Step 1: Create draft
    console.log('📝 Step 1: Creating draft...');
    const draftResponse = await axios.post(`${BASE_URL}/materials/draft`, {
      title: 'Test Material - New Pipeline',
      sourceLanguage: 'en',
      targetLanguage: ['ru', 'pl'],
      userId: 'anonymous'
    });

    if (!draftResponse.data.success) {
      throw new Error(`Failed to create draft: ${draftResponse.data.error}`);
    }

    const material = draftResponse.data.data;
    console.log('✅ Draft created:', {
      id: material.id,
      title: material.title,
      status: material.status,
      sourceLanguage: material.sourceLanguage,
      targetLanguage: material.targetLanguage
    });

    // Step 2: Get drafts
    console.log('\n📋 Step 2: Getting drafts...');
    const draftsResponse = await axios.get(`${BASE_URL}/materials/drafts?userId=anonymous`);
    
    if (!draftsResponse.data.success) {
      throw new Error(`Failed to get drafts: ${draftsResponse.data.error}`);
    }

    console.log('✅ Drafts retrieved:', draftsResponse.data.data.length, 'drafts found');

    // Step 3: Check material details
    console.log('\n🔍 Step 3: Checking material details...');
    const materialResponse = await axios.get(`${BASE_URL}/materials/${material.id}`);
    
    if (!materialResponse.data.success) {
      throw new Error(`Failed to get material: ${materialResponse.data.error}`);
    }

    const materialDetails = materialResponse.data.data;
    console.log('✅ Material details:', {
      id: materialDetails.id,
      title: materialDetails.title,
      status: materialDetails.status,
      audioFileName: materialDetails.audioFileName,
      transcriptionId: materialDetails.transcriptionId
    });

    console.log('\n🎉 New pipeline test completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Upload audio file to the material');
    console.log('2. Wait for transcription');
    console.log('3. Publish the material');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Запускаем тест
testNewPipeline();
