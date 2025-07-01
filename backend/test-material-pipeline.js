const { sequelize, Material, Transcription } = require('./models');
const transcriptionProcessor = require('./utils/transcriptionProcessor');

async function runPipelineTest() {
  await sequelize.sync();

  // 1. Создание черновика
  const draft = await Material.create({
    title: 'Pipeline Test Material',
    targetLanguage: ['en'],
    userId: 'pipeline-test-user',
    status: 'draft',
    language: null
  });
  console.log('✅ Черновик создан:', draft.id);

  // 2. Загрузка файла и запуск транскрипции (эмулируем)
  draft.audioFileName = 'test-audio.mp3';
  draft.status = 'processing';
  await draft.save();

  // Создаём транскрипцию
  const transcription = await Transcription.create({
    originalFileName: 'test-audio.mp3',
    gladiaId: 'pipeline-test-gladia-id',
    status: 'processing',
    full_transcript: '',
    count_of_speakers: 1,
    translation: [],
    sentences: []
  });
  draft.transcriptionId = transcription.id;
  await draft.save();
  console.log('✅ Файл "загружен" и транскрипция создана:', transcription.id);

  // 3. Завершение транскрипции (эмулируем ответ Gladia)
  const gladiaResponse = {
    id: 'pipeline-test-gladia-id',
    result: {
      transcription: {
        languages: ['pl', 'en'],
        full_transcript: 'Cześć! Hello!',
        utterances: [
          { speaker: 0, text: 'Cześć!', start: 0, end: 1, confidence: 0.99 },
          { speaker: 0, text: 'Hello!', start: 1, end: 2, confidence: 0.98 }
        ],
        sentences: [
          { sentence: 'Cześć!', speaker: 0, start: 0, end: 1 },
          { sentence: 'Hello!', speaker: 0, start: 1, end: 2 }
        ]
      },
      metadata: { audio_duration: 2 }
    },
    created_at: new Date().toISOString(),
    completed_at: new Date().toISOString()
  };
  const processedData = transcriptionProcessor.processGladiaResponse(gladiaResponse);
  await transcription.update({
    status: 'completed',
    language: processedData.language,
    full_transcript: processedData.full_transcript,
    count_of_speakers: processedData.count_of_speakers,
    translation: processedData.translation,
    sentences: processedData.sentences,
    duration: gladiaResponse.result.metadata.audio_duration
  });
  draft.status = 'ready';
  draft.language = processedData.language || 'unknown';
  await draft.save();
  console.log('✅ Транскрипция завершена, материал готов к публикации');

  // 4. Публикация материала
  draft.status = 'published';
  draft.isPublic = true;
  draft.description = 'Auto description';
  await draft.save();
  console.log('✅ Материал опубликован:', draft.id);

  // 5. Проверка
  const published = await Material.findByPk(draft.id);
  if (
    published.status === 'published' &&
    published.language === 'pl' &&
    published.targetLanguage.includes('en') &&
    published.isPublic === true
  ) {
    console.log('🎉 Пайплайн тест пройден! Итог:', {
      id: published.id,
      status: published.status,
      language: published.language,
      targetLanguage: published.targetLanguage,
      isPublic: published.isPublic
    });
  } else {
    console.error('❌ Пайплайн тест провален:', published.toJSON());
    process.exit(1);
  }

  // Очистка
  await published.destroy();
  await transcription.destroy();
  await sequelize.close();
}

runPipelineTest().catch(e => {
  console.error('Ошибка в pipeline тесте:', e);
  process.exit(1);
}); 