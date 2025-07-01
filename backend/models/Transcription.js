const { DataTypes } = require('sequelize');

// Создаем функцию для определения модели
const defineTranscription = (sequelize) => {
  return sequelize.define('Transcription', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    originalFileName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    gladiaId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
      defaultValue: 'pending'
    },
    // Основные поля транскрипции согласно data.js
    language: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Язык оригинала'
    },
    full_transcript: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Полный текст транскрипции'
    },
    count_of_speakers: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Количество говорящих в тексте'
    },
    // Перевод всего текста
    translation: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Массив переводов всего текста: [{id, language, text}]'
    },
    // Предложения с их переводами и фразами
    sentences: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Массив предложений с переводами и фразами'
    },
    // Дополнительные поля для совместимости
    sourceLanguage: {
      type: DataTypes.STRING,
      allowNull: true
    },
    targetLanguage: {
      type: DataTypes.STRING,
      allowNull: true
    },
    duration: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    diarization: {
      type: DataTypes.JSON,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'transcriptions'
  });
};

module.exports = defineTranscription; 