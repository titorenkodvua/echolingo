const { Sequelize } = require('sequelize');
const path = require('path');

// Создаем экземпляр Sequelize с SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database/echolingo.sqlite'),
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true, // Автоматически добавляет createdAt и updatedAt
    underscored: false, // Используем camelCase для имен полей
    freezeTableName: true // Не изменяем имена таблиц
  }
});

// Импортируем функции определения моделей
const defineMaterial = require('./Material');
const defineTranscription = require('./Transcription');
const definePlaylist = require('./Playlist');
const definePlaylistMaterial = require('./PlaylistMaterial');

// Создаем экземпляры моделей
const Material = defineMaterial(sequelize);
const Transcription = defineTranscription(sequelize);
const Playlist = definePlaylist(sequelize);
const PlaylistMaterial = definePlaylistMaterial(sequelize);

// Настраиваем связи между моделями
Material.belongsTo(Transcription, {
  foreignKey: 'transcriptionId',
  as: 'transcription'
});

Transcription.hasOne(Material, {
  foreignKey: 'transcriptionId',
  as: 'material'
});

Playlist.belongsToMany(Material, {
  through: PlaylistMaterial,
  foreignKey: 'playlistId',
  otherKey: 'materialId',
  as: 'materials'
});

Material.belongsToMany(Playlist, {
  through: PlaylistMaterial,
  foreignKey: 'materialId',
  otherKey: 'playlistId',
  as: 'playlists'
});

// Функция для инициализации базы данных
const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Синхронизируем модели с базой данных (без alter для избежания backup таблиц)
    await sequelize.sync();
    console.log('✅ Database synchronized successfully.');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

module.exports = {
  sequelize,
  initializeDatabase,
  Material,
  Transcription,
  Playlist,
  PlaylistMaterial
}; 