const { DataTypes } = require('sequelize');

// Создаем функцию для определения модели
const defineMaterial = (sequelize) => {
  return sequelize.define('Material', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    audioFileName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    transcriptionId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    userId: {
      type: DataTypes.STRING,
      defaultValue: 'anonymous'
    },
    tags: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    difficultyLevel: {
      type: DataTypes.ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2'),
      defaultValue: 'B1'
    },
    language: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Язык оригинала'
    },
    targetLanguage: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    estimatedTime: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    averageRating: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    ratingCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true
    },
    author: {
      type: DataTypes.STRING,
      allowNull: true
    },
    recommendedRepetitions: {
      type: DataTypes.INTEGER,
      defaultValue: 5
    },
    status: {
      type: DataTypes.ENUM('draft', 'processing', 'ready', 'published', 'failed'),
      defaultValue: 'draft'
    },
    playCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lastPlayed: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'materials'
  });
};

module.exports = defineMaterial; 