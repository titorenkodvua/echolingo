const { DataTypes } = require('sequelize');

// Создаем функцию для определения модели
const definePlaylistMaterial = (sequelize) => {
  return sequelize.define('PlaylistMaterial', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    playlistId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    materialId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    addedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'playlist_materials',
    indexes: [
      {
        unique: true,
        fields: ['playlistId', 'materialId']
      }
    ]
  });
};

module.exports = definePlaylistMaterial; 