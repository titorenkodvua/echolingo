const { Material, Transcription, Playlist, PlaylistMaterial, sequelize } = require('../models');

class DatabaseService {
  // Методы для работы с транскрипциями
  async createTranscription(transcriptionData) {
    try {
      const transcription = await Transcription.create(transcriptionData);
      return transcription;
    } catch (error) {
      console.error('Error creating transcription:', error);
      throw error;
    }
  }

  async getTranscriptionById(id) {
    try {
      const transcription = await Transcription.findByPk(id);
      return transcription;
    } catch (error) {
      console.error('Error getting transcription:', error);
      throw error;
    }
  }

  async updateTranscription(id, updateData) {
    try {
      const transcription = await Transcription.findByPk(id);
      if (!transcription) {
        throw new Error('Transcription not found');
      }
      await transcription.update(updateData);
      return transcription;
    } catch (error) {
      console.error('Error updating transcription:', error);
      throw error;
    }
  }

  async getAllTranscriptions() {
    try {
      const transcriptions = await Transcription.findAll({
        order: [['createdAt', 'DESC']]
      });
      return transcriptions;
    } catch (error) {
      console.error('Error getting transcriptions:', error);
      throw error;
    }
  }

  // Методы для работы с материалами
  async createMaterial(materialData) {
    try {
      const material = await Material.create(materialData);
      return material;
    } catch (error) {
      console.error('Error creating material:', error);
      throw error;
    }
  }

  async getMaterialById(id) {
    try {
      const material = await Material.findByPk(id, {
        include: [{
          model: Transcription,
          as: 'transcription'
        }]
      });
      return material;
    } catch (error) {
      console.error('Error getting material:', error);
      throw error;
    }
  }

  async updateMaterial(id, updateData) {
    try {
      const material = await Material.findByPk(id);
      if (!material) {
        throw new Error('Material not found');
      }
      await material.update(updateData);
      return material;
    } catch (error) {
      console.error('Error updating material:', error);
      throw error;
    }
  }

  async deleteMaterial(id) {
    try {
      const material = await Material.findByPk(id);
      if (!material) {
        throw new Error('Material not found');
      }
      await material.destroy();
      return true;
    } catch (error) {
      console.error('Error deleting material:', error);
      throw error;
    }
  }

  async getAllMaterials(filters = {}) {
    try {
      const where = {};
      
      if (filters.userId) {
        where.userId = filters.userId;
      }
      
      if (filters.isPublic !== undefined) {
        where.isPublic = filters.isPublic;
      }
      
      if (filters.difficultyLevel) {
        where.difficultyLevel = filters.difficultyLevel;
      }
      
      if (filters.language) {
        where.language = filters.language;
      }

      const materials = await Material.findAll({
        where,
        include: [{
          model: Transcription,
          as: 'transcription'
        }],
        order: [['createdAt', 'DESC']]
      });
      
      return materials;
    } catch (error) {
      console.error('Error getting materials:', error);
      throw error;
    }
  }

  // Методы для работы с плейлистами
  async createPlaylist(playlistData) {
    try {
      const playlist = await Playlist.create(playlistData);
      return playlist;
    } catch (error) {
      console.error('Error creating playlist:', error);
      throw error;
    }
  }

  async getPlaylistById(id) {
    try {
      const playlist = await Playlist.findByPk(id, {
        include: [{
          model: Material,
          as: 'materials',
          through: { attributes: ['order', 'addedAt'] },
          include: [{
            model: Transcription,
            as: 'transcription'
          }]
        }]
      });
      return playlist;
    } catch (error) {
      console.error('Error getting playlist:', error);
      throw error;
    }
  }

  async updatePlaylist(id, updateData) {
    try {
      const playlist = await Playlist.findByPk(id);
      if (!playlist) {
        throw new Error('Playlist not found');
      }
      await playlist.update(updateData);
      return playlist;
    } catch (error) {
      console.error('Error updating playlist:', error);
      throw error;
    }
  }

  async deletePlaylist(id) {
    try {
      const playlist = await Playlist.findByPk(id);
      if (!playlist) {
        throw new Error('Playlist not found');
      }
      await playlist.destroy();
      return true;
    } catch (error) {
      console.error('Error deleting playlist:', error);
      throw error;
    }
  }

  async getAllPlaylists(filters = {}) {
    try {
      const where = {};
      
      if (filters.userId) {
        where.userId = filters.userId;
      }
      
      if (filters.isPublic !== undefined) {
        where.isPublic = filters.isPublic;
      }

      const playlists = await Playlist.findAll({
        where,
        include: [{
          model: Material,
          as: 'materials',
          through: { attributes: ['order', 'addedAt'] }
        }],
        order: [['createdAt', 'DESC']]
      });
      
      return playlists;
    } catch (error) {
      console.error('Error getting playlists:', error);
      throw error;
    }
  }

  // Методы для работы с материалами в плейлистах
  async addMaterialToPlaylist(playlistId, materialId, order = 0) {
    try {
      const playlistMaterial = await PlaylistMaterial.create({
        playlistId,
        materialId,
        order
      });
      
      // Обновляем количество материалов в плейлисте
      const playlist = await Playlist.findByPk(playlistId);
      if (playlist) {
        const materialCount = await PlaylistMaterial.count({
          where: { playlistId }
        });
        await playlist.update({ materialCount });
      }
      
      return playlistMaterial;
    } catch (error) {
      console.error('Error adding material to playlist:', error);
      throw error;
    }
  }

  async removeMaterialFromPlaylist(playlistId, materialId) {
    try {
      const result = await PlaylistMaterial.destroy({
        where: { playlistId, materialId }
      });
      
      // Обновляем количество материалов в плейлисте
      const playlist = await Playlist.findByPk(playlistId);
      if (playlist) {
        const materialCount = await PlaylistMaterial.count({
          where: { playlistId }
        });
        await playlist.update({ materialCount });
      }
      
      return result > 0;
    } catch (error) {
      console.error('Error removing material from playlist:', error);
      throw error;
    }
  }

  // Методы для статистики
  async getDatabaseStats() {
    try {
      const stats = {
        transcriptions: await Transcription.count(),
        materials: await Material.count(),
        playlists: await Playlist.count(),
        playlistMaterials: await PlaylistMaterial.count()
      };
      return stats;
    } catch (error) {
      console.error('Error getting database stats:', error);
      throw error;
    }
  }

  // Метод для очистки старых данных
  async cleanupOldData(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const deletedTranscriptions = await Transcription.destroy({
        where: {
          createdAt: {
            [sequelize.Op.lt]: cutoffDate
          },
          status: 'failed'
        }
      });
      
      return { deletedTranscriptions };
    } catch (error) {
      console.error('Error cleaning up old data:', error);
      throw error;
    }
  }
}

module.exports = DatabaseService; 