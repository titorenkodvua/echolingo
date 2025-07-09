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
    duration: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Длительность аудио в секундах'
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Краткое содержание транскрипции'
    },
    diarization: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Данные диаризации (разделение по говорящим)'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Метаданные от Gladia API'
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