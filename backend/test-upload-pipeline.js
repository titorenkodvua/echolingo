const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3001/api';

async function testUploadPipeline() {
  console.log('🧪 Testing upload pipeline...\n');

  try {
    // Step 1: Create draft
    console.log('📝 Step 1: Creating draft...');
    const draftResponse = await axios.post(`${BASE_URL}/materials/draft`, {
      title: 'Upload Test Material',
      sourceLanguage: 'en',
      targetLanguage: ['ru'],
      userId: 'anonymous'
    });

    if (!draftResponse.data.success) {
      throw new Error(`Failed to create draft: ${draftResponse.data.error}`);
    }

    const material = draftResponse.data.data;
    console.log('✅ Draft created:', material.id);

    // Step 2: Upload file
    console.log('\n📁 Step 2: Uploading file...');
    
    // Find a test audio file
    const uploadsDir = path.join(__dirname, 'uploads', 'anonymous');
    const files = fs.readdirSync(uploadsDir).filter(file => file.endsWith('.mp3'));
    
    if (files.length === 0) {
      console.log('❌ No test audio files found in uploads/anonymous/');
      return;
    }

    const testFile = files[0];
    const filePath = path.join(uploadsDir, testFile);
    console.log(`📂 Using test file: ${testFile}`);

    const formData = new FormData();
    formData.append('audio', fs.createReadStream(filePath));

    const uploadResponse = await axios.put(`${BASE_URL}/materials/${material.id}/upload-file`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    if (!uploadResponse.data.success) {
      throw new Error(`Failed to upload file: ${uploadResponse.data.error}`);
    }

    const { predictionId } = uploadResponse.data.data;
    console.log('✅ File uploaded, predictionId:', predictionId);

    // Step 3: Check material status
    console.log('\n🔍 Step 3: Checking material status...');
    const materialResponse = await axios.get(`${BASE_URL}/materials/${material.id}`);
    
    if (!materialResponse.data.success) {
      throw new Error(`Failed to get material: ${materialResponse.data.error}`);
    }

    const materialDetails = materialResponse.data.data;
    console.log('✅ Material updated:', {
      status: materialDetails.status,
      audioFileName: materialDetails.audioFileName,
      transcriptionId: materialDetails.transcriptionId
    });

    console.log('\n🎉 Upload pipeline test completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Wait for transcription completion');
    console.log('2. Publish the material');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testUploadPipeline(); 