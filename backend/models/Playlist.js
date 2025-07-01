const { DataTypes } = require('sequelize');

// Создаем функцию для определения модели
const definePlaylist = (sequelize) => {
  return sequelize.define('Playlist', {
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
    userId: {
      type: DataTypes.STRING,
      defaultValue: 'anonymous'
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    difficultyLevel: {
      type: DataTypes.ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2'),
      allowNull: true
    },
    sourceLanguage: {
      type: DataTypes.STRING,
      allowNull: true
    },
    targetLanguage: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true
    },
    tags: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    estimatedTime: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    materialCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived'),
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
    tableName: 'playlists'
  });
};

module.exports = definePlaylist; 