const { sequelize, Material, Transcription } = require('./models');
const { Op } = require('sequelize');
const transcriptionProcessor = require('./utils/transcriptionProcessor');

async function fixMaterialsLanguage() {
  await sequelize.sync();

  // Находим все материалы, у которых language = null и есть transcriptionId
  const materials = await Material.findAll({
    where: {
      language: null,
      transcriptionId: { [Op.not]: null }
    }
  });

  let updatedCount = 0;

  for (const material of materials) {
    const transcription = await Transcription.findByPk(material.transcriptionId);
    if (!transcription) continue;

    // Пытаемся извлечь languages из sentences/metadata/full_transcript
    let language = null;
    try {
      // Попробуем из sentences (если там есть info)
      let parsedSentences = [];
      if (typeof transcription.sentences === 'string') {
        parsedSentences = JSON.parse(transcription.sentences);
      } else if (Array.isArray(transcription.sentences)) {
        parsedSentences = transcription.sentences;
      }
      // Попробуем из metadata
      let parsedMetadata = {};
      if (typeof transcription.metadata === 'string') {
        parsedMetadata = JSON.parse(transcription.metadata);
      } else if (typeof transcription.metadata === 'object' && transcription.metadata !== null) {
        parsedMetadata = transcription.metadata;
      }
      // Попробуем из translation
      let parsedTranslation = [];
      if (typeof transcription.translation === 'string') {
        parsedTranslation = JSON.parse(transcription.translation);
      } else if (Array.isArray(transcription.translation)) {
        parsedTranslation = transcription.translation;
      }
      // Попробуем из full_transcript (нет языков, но вдруг)
      // Но лучше всего — если есть поле languages в metadata или sentences
      // Но чаще всего — нет, поэтому fallback
      // Если есть поле language в metadata
      if (parsedMetadata.languages && Array.isArray(parsedMetadata.languages) && parsedMetadata.languages.length > 0) {
        language = parsedMetadata.languages[0];
      }
      // Если нет — пробуем из translation
      if (!language && parsedTranslation.length > 0 && parsedTranslation[0].language) {
        language = parsedTranslation[0].language;
      }
      // Если нет — пробуем из sentences
      if (!language && parsedSentences.length > 0 && parsedSentences[0].translation && parsedSentences[0].translation[0] && parsedSentences[0].translation[0].language) {
        language = parsedSentences[0].translation[0].language;
      }
    } catch (e) {
      // ignore
    }
    if (!language) language = 'unknown';
    material.language = language;
    await material.save();
    updatedCount++;
    console.log(`Обновлён материал ${material.id}: language = ${language}`);
  }

  console.log(`Всего обновлено материалов: ${updatedCount}`);
  await sequelize.close();
}

fixMaterialsLanguage().catch(e => {
  console.error('Ошибка при обновлении language:', e);
  process.exit(1);
}); 