require('dotenv').config();
const gladiaService = require('./services/gladiaService');
const path = require('path');

async function testGladiaAPI() {
  console.log('🧪 Testing Gladia V2 API Integration...\n');

  // Проверяем наличие API ключа
  console.log('1. Checking API key configuration...');
  try {
    const apiKey = gladiaService.getApiKey();
    if (apiKey === 'your_gladia_api_key_here') {
      console.log('❌ API key not configured! Please set GLADIA_API_KEY in .env file');
      console.log('   Get your API key from: https://app.gladia.io/');
      return;
    }
    console.log('✅ API key found:', apiKey.substring(0, 8) + '...');
  } catch (error) {
    console.log('❌ API key error:', error.message);
    return;
  }

  // Проверяем подключение к API
  console.log('\n2. Testing API connection...');
  try {
    const axios = require('axios');
    const response = await axios.get('https://api.gladia.io/health/', {
      headers: {
        'x-gladia-key': gladiaService.getApiKey()
      },
      timeout: 10000
    });
    console.log('✅ API connection successful');
    console.log('   Status:', response.status);
  } catch (error) {
    console.log('❌ API connection failed:', error.message);
    if (error.response?.status === 401) {
      console.log('   This usually means the API key is invalid');
    }
    return;
  }

  // Проверяем наличие тестового аудиофайла
  console.log('\n3. Checking for test audio file...');
  const testAudioPath = path.join(__dirname, 'test-audio.mp3');
  const fs = require('fs');
  
  if (!fs.existsSync(testAudioPath)) {
    console.log('⚠️  Test audio file not found');
    console.log('   Create a test audio file at:', testAudioPath);
    console.log('   Or use any MP3 file for testing');
    console.log('\n📝 To test transcription:');
    console.log('   node test-gladia.js <path-to-your-audio-file>');
    return;
  }
  
  console.log('✅ Test audio file found:', testAudioPath);

  // Тестируем загрузку файла
  console.log('\n4. Testing file upload...');
  try {
    console.log('   Uploading test file...');
    const uploadResult = await gladiaService.uploadAudio(testAudioPath);
    
    console.log('✅ File upload successful!');
    console.log('   Audio URL:', uploadResult.audio_url);
    console.log('   File ID:', uploadResult.audio_metadata.id);
    console.log('   Duration:', uploadResult.audio_metadata.audio_duration, 'seconds');
    
  } catch (error) {
    console.log('❌ File upload failed:', error.message);
    return;
  }

  // Тестируем транскрибацию
  console.log('\n5. Testing transcription...');
  try {
    console.log('   Starting transcription (this may take a few minutes)...');
    const result = await gladiaService.transcribeAudioComplete(testAudioPath);
    
    console.log('✅ Transcription successful!');
    console.log('   Prediction ID:', result.id);
    console.log('   Status:', result.status);
    
    if (result.result) {
      console.log('   Transcription preview:');
      const transcription = result.result.transcription;
      if (transcription) {
        const preview = transcription.substring(0, 200) + '...';
        console.log('   ', preview);
      }
      
      // Показываем информацию о сегментах
      if (result.result.utterances && result.result.utterances.length > 0) {
        console.log(`   Segments: ${result.result.utterances.length} found`);
        console.log('   First segment:', result.result.utterances[0].text);
      }
      
      // Показываем информацию о переводах
      if (result.result.translation && result.result.translation.length > 0) {
        console.log(`   Translations: ${result.result.translation.length} languages`);
        result.result.translation.forEach(trans => {
          console.log(`     ${trans.language}: ${trans.text.substring(0, 100)}...`);
        });
      }
    }
    
  } catch (error) {
    console.log('❌ Transcription failed:', error.message);
  }
}

// Если передан путь к файлу как аргумент
if (process.argv[2]) {
  const audioPath = process.argv[2];
  console.log(`🧪 Testing V2 API transcription with file: ${audioPath}\n`);
  
  if (!fs.existsSync(audioPath)) {
    console.log('❌ File not found:', audioPath);
    process.exit(1);
  }
  
  gladiaService.transcribeAudioComplete(audioPath)
    .then(result => {
      console.log('✅ Transcription successful!');
      console.log('Result:', JSON.stringify(result, null, 2));
    })
    .catch(error => {
      console.log('❌ Transcription failed:', error.message);
      process.exit(1);
    });
} else {
  testGladiaAPI();
} 