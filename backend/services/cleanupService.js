const { Material, Transcription, sequelize } = require('../models');
const { Op } = require('sequelize');
const audioService = require('./audioService');
const path = require('path');

/**
 * Удаляет все материалы, которые не опубликованы (status !== 'published'),
 * а также связанные с ними транскрипции и аудиофайлы.
 */
async function cleanupStaleMaterials() {
  try {
    // 1. Найти все материалы, которые не опубликованы
    const staleMaterials = await Material.findAll({
      where: {
        status: { [Op.ne]: 'published' }
      }
    });

    for (const material of staleMaterials) {
      // 2. Удалить связанный аудиофайл, если есть
      if (material.audioFileName) {
        // Путь: uploads/{userId}/{audioFileName}
        const userId = material.userId || 'anonymous';
        const filePath = path.join(__dirname, '..', 'uploads', userId, material.audioFileName);
        await audioService.deleteFile(filePath);
      }

      // 3. Удалить связанную транскрипцию, если есть
      if (material.transcriptionId) {
        const transcription = await Transcription.findByPk(material.transcriptionId);
        if (transcription) {
          await transcription.destroy();
        }
      }

      // 4. Удалить сам материал
      await material.destroy();
    }

    console.log(`🧹 Cleanup complete: deleted ${staleMaterials.length} non-published materials and their data.`);
    return { deleted: staleMaterials.length };
  } catch (error) {
    console.error('Cleanup error:', error);
    throw error;
  }
}

module.exports = {
  cleanupStaleMaterials
}; 