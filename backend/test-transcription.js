require('dotenv').config();
const gladiaService = require('./services/gladiaService');
const path = require('path');
const fs = require('fs');

async function testTranscription() {
  console.log('🎤 Testing Complete Transcription Process\n');

  // Находим последний загруженный файл
  const uploadsDir = path.join(__dirname, 'uploads');
  const userDirs = fs.readdirSync(uploadsDir).filter(dir => 
    fs.statSync(path.join(uploadsDir, dir)).isDirectory() && 
    dir !== 'temp' && 
    dir !== 'anonymous'
  );

  if (userDirs.length === 0) {
    console.log('❌ No user directories found');
    return;
  }

  const userDir = userDirs[0]; // Берем первую папку пользователя
  const userPath = path.join(uploadsDir, userDir);
  const files = fs.readdirSync(userPath).filter(file => 
    file.match(/\.(mp3|wav|m4a|flac|ogg)$/i)
  );

  if (files.length === 0) {
    console.log('❌ No audio files found in uploads');
    return;
  }

  // Берем последний загруженный файл
  const latestFile = files[files.length - 1];
  const filePath = path.join(userPath, latestFile);
  
  console.log('📁 Found uploaded file:', latestFile);
  console.log('📂 File path:', filePath);
  console.log('📊 File size:', (fs.statSync(filePath).size / 1024 / 1024).toFixed(2), 'MB');

  // Проверяем API ключ
  console.log('\n🔑 Checking API key...');
  try {
    const apiKey = gladiaService.getApiKey();
    console.log('✅ API key configured:', apiKey.substring(0, 8) + '...');
  } catch (error) {
    console.log('❌ API key error:', error.message);
    return;
  }

  // Запускаем полный процесс транскрибации
  console.log('\n🚀 Starting complete transcription process...');
  console.log('   This may take several minutes depending on file size...');
  
  try {
    const startTime = Date.now();
    
    const result = await gladiaService.transcribeAudioComplete(filePath);
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log('\n✅ Transcription completed successfully!');
    console.log(`⏱️  Total time: ${duration.toFixed(1)} seconds`);
    console.log('🆔 Prediction ID:', result.id);
    console.log('📊 Status:', result.status);
    
    if (result.result) {
      console.log('\n📝 Transcription Results:');
      
      // Полный текст
      if (result.result.transcription) {
        console.log('\n📄 Full Transcription:');
        console.log(result.result.transcription);
      }
      
      // Сегменты (utterances)
      if (result.result.utterances && result.result.utterances.length > 0) {
        console.log(`\n🎯 Segments (${result.result.utterances.length}):`);
        result.result.utterances.forEach((utterance, index) => {
          console.log(`   ${index + 1}. [${utterance.start.toFixed(1)}s - ${utterance.end.toFixed(1)}s] Speaker ${utterance.speaker}: "${utterance.text}"`);
        });
      }
      
      // Переводы
      if (result.result.translation && result.result.translation.length > 0) {
        console.log('\n🌍 Translations:');
        result.result.translation.forEach(trans => {
          console.log(`   ${trans.language.toUpperCase()}: ${trans.text}`);
        });
      }
      
      // Метаданные
      if (result.result.metadata) {
        console.log('\n📊 Metadata:');
        console.log(`   Audio duration: ${result.result.metadata.audio_duration} seconds`);
        console.log(`   Transcription time: ${result.result.metadata.transcription_time} seconds`);
        console.log(`   Number of channels: ${result.result.metadata.number_of_channels}`);
      }
    }
    
  } catch (error) {
    console.log('❌ Transcription failed:', error.message);
    console.log('   Error details:', error);
  }
}

// Запускаем тест
testTranscription().catch(console.error); 