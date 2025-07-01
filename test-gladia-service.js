require('dotenv').config();
const fs = require('fs');
const path = require('path');
const gladiaService = require('./backend/services/gladiaService');

// === КОНФИГ ===
const AUDIO_FILE_PATH = 'uploads/string/1751055302925-41c4a468.mp3';
const OUTPUT_FILE = `gladia-service-test-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

async function testGladiaService() {
  console.log('🧪 Тестирование GladiaService напрямую');
  console.log(`📁 Аудиофайл: ${AUDIO_FILE_PATH}`);
  console.log(`📊 Результат: ${OUTPUT_FILE}`);
  console.log('');

  try {
    // 1. Проверяем, что файл существует
    if (!fs.existsSync(AUDIO_FILE_PATH)) {
      throw new Error(`Аудиофайл не найден: ${AUDIO_FILE_PATH}`);
    }

    const fileStats = fs.statSync(AUDIO_FILE_PATH);
    console.log(`✅ Файл найден: ${(fileStats.size / 1024 / 1024).toFixed(2)} MB`);

    // 2. Запускаем полный процесс транскрибации через gladiaService
    console.log('🚀 Запуск transcribeAudioComplete()...');
    const rawGladiaResult = await gladiaService.transcribeAudioComplete(AUDIO_FILE_PATH);

    // 3. Сохраняем сырой результат от Gladia API
    const result = {
      timestamp: new Date().toISOString(),
      audioFile: AUDIO_FILE_PATH,
      rawGladiaResponse: rawGladiaResult,
      summary: {
        status: rawGladiaResult.status,
        hasTranscript: !!rawGladiaResult.prediction,
        hasSentences: !!(rawGladiaResult.prediction && rawGladiaResult.prediction.sentences),
        hasTranslation: !!(rawGladiaResult.prediction && rawGladiaResult.prediction.translation),
        hasDiarization: !!(rawGladiaResult.prediction && rawGladiaResult.prediction.diarization),
        hasSummary: !!(rawGladiaResult.prediction && rawGladiaResult.prediction.summary),
        sentenceCount: rawGladiaResult.prediction?.sentences?.length || 0,
        translationCount: rawGladiaResult.prediction?.translation?.length || 0,
        speakerCount: rawGladiaResult.prediction?.diarization?.speakers?.length || 0
      }
    };

    // 4. Сохраняем результат
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));
    console.log(`💾 Результат сохранен в: ${OUTPUT_FILE}`);
    console.log('');

    // 5. Показываем краткую сводку
    console.log('📊 СВОДКА РЕЗУЛЬТАТА:');
    console.log(`   Статус: ${result.summary.status}`);
    console.log(`   Предложение: ${result.summary.sentenceCount}`);
    console.log(`   Переводы: ${result.summary.translationCount}`);
    console.log(`   Дикторы: ${result.summary.speakerCount}`);
    console.log(`   Есть транскрипт: ${result.summary.hasTranscript}`);
    console.log(`   Есть перевод: ${result.summary.hasTranslation}`);
    console.log(`   Есть диаризация: ${result.summary.hasDiarization}`);
    console.log(`   Есть резюме: ${result.summary.hasSummary}`);

    // 6. Показываем примеры данных (если есть)
    if (rawGladiaResult.prediction) {
      console.log('');
      console.log('📝 ПРИМЕРЫ ДАННЫХ:');
      
      if (rawGladiaResult.prediction.sentences && rawGladiaResult.prediction.sentences.length > 0) {
        console.log('   Первое предложение:', rawGladiaResult.prediction.sentences[0]);
      }
      
      if (rawGladiaResult.prediction.translation && rawGladiaResult.prediction.translation.length > 0) {
        console.log('   Первый перевод:', rawGladiaResult.prediction.translation[0]);
      }
      
      if (rawGladiaResult.prediction.summary) {
        console.log('   Резюме:', rawGladiaResult.prediction.summary);
      }
    }

    console.log('');
    console.log('🎉 Тест GladiaService завершен успешно!');

  } catch (error) {
    console.error('❌ Ошибка тестирования GladiaService:', error.message);
    
    // Сохраняем ошибку в файл
    const errorResult = {
      timestamp: new Date().toISOString(),
      audioFile: AUDIO_FILE_PATH,
      error: error.message,
      stack: error.stack
    };
    
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(errorResult, null, 2));
    console.log(`💾 Ошибка сохранена в: ${OUTPUT_FILE}`);
    
    process.exit(1);
  }
}

// Запускаем тест
testGladiaService(); 