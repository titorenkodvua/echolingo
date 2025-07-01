const { sequelize, Material, Transcription } = require('./models');
const transcriptionProcessor = require('./utils/transcriptionProcessor');

async function runTest() {
  await sequelize.sync();

  // 1. Создаём материал и транскрипцию
  const material = await Material.create({
    title: 'Test Material',
    targetLanguage: ['ru'],
    userId: 'test-user',
    status: 'processing',
    language: null
  });

  const transcription = await Transcription.create({
    originalFileName: 'test.mp3',
    gladiaId: 'test-gladia-id',
    status: 'processing',
    full_transcript: '',
    count_of_speakers: 1,
    translation: [],
    sentences: []
  });

  material.transcriptionId = transcription.id;
  await material.save();

  // 2. Эмулируем ответ от Gladia
  const gladiaResponse = {
    id: 'test-gladia-id',
    result: {
      transcription: {
        languages: ['fr', 'en', 'de'],
        full_transcript: 'Bonjour! Hello! Hallo!',
        utterances: [
          { speaker: 0, text: 'Bonjour!', start: 0, end: 1, confidence: 0.99 },
          { speaker: 0, text: 'Hello!', start: 1, end: 2, confidence: 0.98 },
          { speaker: 0, text: 'Hallo!', start: 2, end: 3, confidence: 0.97 }
        ],
        sentences: [
          { sentence: 'Bonjour!', speaker: 0, start: 0, end: 1 },
          { sentence: 'Hello!', speaker: 0, start: 1, end: 2 },
          { sentence: 'Hallo!', speaker: 0, start: 2, end: 3 }
        ]
      },
      metadata: { audio_duration: 3 }
    },
    created_at: new Date().toISOString(),
    completed_at: new Date().toISOString()
  };

  // 3. Обрабатываем результат через transcriptionProcessor
  const processedData = transcriptionProcessor.processGladiaResponse(gladiaResponse);

  // 4. Обновляем транскрипцию и материал, как это делается в /status/:predictionId
  await transcription.update({
    status: 'completed',
    language: processedData.language,
    full_transcript: processedData.full_transcript,
    count_of_speakers: processedData.count_of_speakers,
    translation: processedData.translation,
    sentences: processedData.sentences,
    duration: gladiaResponse.result.metadata.audio_duration
  });

  // Обновляем материал
  material.status = 'ready';
  material.language = processedData.language || 'unknown';
  await material.save();

  // 5. Проверяем результат
  const updatedMaterial = await Material.findByPk(material.id);
  console.log('Материал после обновления:', {
    id: updatedMaterial.id,
    language: updatedMaterial.language,
    status: updatedMaterial.status
  });

  if (updatedMaterial.language === 'fr' && updatedMaterial.status === 'ready') {
    console.log('✅ Тест пройден: language корректно установлен из первого элемента массива languages');
  } else {
    console.error('❌ Тест провален: language =', updatedMaterial.language);
    process.exit(1);
  }

  // Очистка
  await updatedMaterial.destroy();
  await transcription.destroy();
  await sequelize.close();
}

runTest().catch(e => {
  console.error('Ошибка в тесте:', e);
  process.exit(1);
}); 