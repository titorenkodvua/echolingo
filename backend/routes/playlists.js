const express = require('express');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Временное хранилище плейлистов (в реальном проекте будет база данных)
const playlists = new Map();

/**
 * @swagger
 * /api/playlists:
 *   post:
 *     summary: Создать новый плейлист
 *     description: Создает новый плейлист для группировки материалов
 *     tags: [Playlists]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 description: Название плейлиста
 *               description:
 *                 type: string
 *                 description: Описание плейлиста
 *               userId:
 *                 type: string
 *                 description: ID пользователя (по умолчанию 'anonymous')
 *               isPublic:
 *                 type: boolean
 *                 description: Публичный ли плейлист
 *               materialIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Список ID материалов
 *     responses:
 *       201:
 *         description: Плейлист успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Playlist'
 *       400:
 *         description: Ошибка валидации
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      userId = 'anonymous',
      isPublic = false,
      materialIds = []
    } = req.body;

    if (!title) {
      return res.status(400).json({
        error: 'Title is required'
      });
    }

    const playlistId = uuidv4();
    const playlist = {
      id: playlistId,
      title: title,
      description: description || '',
      userId: userId,
      isPublic: isPublic,
      materialIds: materialIds,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active', // active, archived, deleted
      playCount: 0,
      lastPlayed: null
    };

    playlists.set(playlistId, playlist);

    res.status(201).json({
      success: true,
      message: 'Playlist created successfully',
      data: playlist
    });

  } catch (error) {
    console.error('Create playlist error:', error);
    res.status(500).json({
      error: 'Failed to create playlist',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/playlists:
 *   get:
 *     summary: Получить список плейлистов пользователя
 *     description: Возвращает список плейлистов, принадлежащих пользователю
 *     tags: [Playlists]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: ID пользователя (по умолчанию 'anonymous')
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, archived, deleted]
 *           default: active
 *         description: Статус плейлистов для фильтрации
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Количество плейлистов на странице
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Смещение для пагинации
 *     responses:
 *       200:
 *         description: Список плейлистов
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     playlists:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Playlist'
 *                     total:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId || 'anonymous';
    const { status = 'active', limit = 50, offset = 0 } = req.query;

    let userPlaylists = Array.from(playlists.values())
      .filter(playlist => playlist.userId === userId && playlist.status === status)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    // Пагинация
    const paginatedPlaylists = userPlaylists.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
      success: true,
      data: {
        playlists: paginatedPlaylists,
        total: userPlaylists.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('Get playlists error:', error);
    res.status(500).json({
      error: 'Failed to get playlists',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/playlists/public:
 *   get:
 *     summary: Получить публичные плейлисты
 *     description: Возвращает список публичных плейлистов всех пользователей
 *     tags: [Playlists]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Количество плейлистов на странице
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Смещение для пагинации
 *     responses:
 *       200:
 *         description: Список публичных плейлистов
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     playlists:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Playlist'
 *                     total:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 */
router.get('/public', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    let publicPlaylists = Array.from(playlists.values())
      .filter(playlist => playlist.isPublic && playlist.status === 'active')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Пагинация
    const paginatedPlaylists = publicPlaylists.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
      success: true,
      data: {
        playlists: paginatedPlaylists,
        total: publicPlaylists.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('Get public playlists error:', error);
    res.status(500).json({
      error: 'Failed to get public playlists',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/playlists/{playlistId}:
 *   get:
 *     summary: Получить плейлист по ID
 *     description: Возвращает конкретный плейлист по его ID
 *     tags: [Playlists]
 *     parameters:
 *       - in: path
 *         name: playlistId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID плейлиста
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: ID пользователя (по умолчанию 'anonymous')
 *     responses:
 *       200:
 *         description: Данные плейлиста
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Playlist'
 *       403:
 *         description: Доступ запрещен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Плейлист не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:playlistId', async (req, res) => {
  try {
    const { playlistId } = req.params;
    const userId = req.query.userId || 'anonymous';

    const playlist = playlists.get(playlistId);

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    // Проверяем права доступа
    if (!playlist.isPublic && playlist.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      data: playlist
    });

  } catch (error) {
    console.error('Get playlist error:', error);
    res.status(500).json({
      error: 'Failed to get playlist',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/playlists/{playlistId}:
 *   put:
 *     summary: Обновить плейлист
 *     description: Обновляет данные плейлиста
 *     tags: [Playlists]
 *     parameters:
 *       - in: path
 *         name: playlistId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID плейлиста
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: ID пользователя (по умолчанию 'anonymous')
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Новое название плейлиста
 *               description:
 *                 type: string
 *                 description: Новое описание плейлиста
 *               isPublic:
 *                 type: boolean
 *                 description: Публичный ли плейлист
 *               materialIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Новый список ID материалов
 *     responses:
 *       200:
 *         description: Плейлист успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Playlist'
 *       403:
 *         description: Доступ запрещен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Плейлист не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:playlistId', async (req, res) => {
  try {
    const { playlistId } = req.params;
    const userId = req.query.userId || 'anonymous';
    const {
      title,
      description,
      isPublic,
      materialIds
    } = req.body;

    const playlist = playlists.get(playlistId);

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    if (playlist.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Обновляем поля
    if (title !== undefined) playlist.title = title;
    if (description !== undefined) playlist.description = description;
    if (isPublic !== undefined) playlist.isPublic = isPublic;
    if (materialIds !== undefined) playlist.materialIds = materialIds;
    
    playlist.updatedAt = new Date().toISOString();

    playlists.set(playlistId, playlist);

    res.json({
      success: true,
      message: 'Playlist updated successfully',
      data: playlist
    });

  } catch (error) {
    console.error('Update playlist error:', error);
    res.status(500).json({
      error: 'Failed to update playlist',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/playlists/{playlistId}/materials:
 *   post:
 *     summary: Добавить материал в плейлист
 *     description: Добавляет материал в существующий плейлист
 *     tags: [Playlists]
 *     parameters:
 *       - in: path
 *         name: playlistId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID плейлиста
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: ID пользователя (по умолчанию 'anonymous')
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - materialId
 *             properties:
 *               materialId:
 *                 type: string
 *                 description: ID материала для добавления
 *     responses:
 *       200:
 *         description: Материал успешно добавлен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Playlist'
 *       403:
 *         description: Доступ запрещен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Плейлист не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:playlistId/materials', async (req, res) => {
  try {
    const { playlistId } = req.params;
    const userId = req.query.userId || 'anonymous';
    const { materialId } = req.body;

    if (!materialId) {
      return res.status(400).json({ error: 'materialId is required' });
    }

    const playlist = playlists.get(playlistId);

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    if (playlist.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Проверяем, не добавлен ли уже материал
    if (playlist.materialIds.includes(materialId)) {
      return res.status(400).json({ error: 'Material already in playlist' });
    }

    playlist.materialIds.push(materialId);
    playlist.updatedAt = new Date().toISOString();

    playlists.set(playlistId, playlist);

    res.json({
      success: true,
      message: 'Material added to playlist successfully',
      data: playlist
    });

  } catch (error) {
    console.error('Add material to playlist error:', error);
    res.status(500).json({
      error: 'Failed to add material to playlist',
      message: error.message
    });
  }
});

// Удаление материала из плейлиста
router.delete('/:playlistId/materials/:materialId', async (req, res) => {
  try {
    const { playlistId, materialId } = req.params;
    const userId = req.query.userId || 'anonymous';

    const playlist = playlists.get(playlistId);

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    if (playlist.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const materialIndex = playlist.materialIds.indexOf(materialId);
    if (materialIndex === -1) {
      return res.status(404).json({ error: 'Material not found in playlist' });
    }

    playlist.materialIds.splice(materialIndex, 1);
    playlist.updatedAt = new Date().toISOString();

    playlists.set(playlistId, playlist);

    res.json({
      success: true,
      message: 'Material removed from playlist successfully',
      data: playlist
    });

  } catch (error) {
    console.error('Remove material from playlist error:', error);
    res.status(500).json({
      error: 'Failed to remove material from playlist',
      message: error.message
    });
  }
});

// Изменение порядка материалов в плейлисте
router.put('/:playlistId/materials/reorder', async (req, res) => {
  try {
    const { playlistId } = req.params;
    const userId = req.query.userId || 'anonymous';
    const { materialIds } = req.body;

    if (!Array.isArray(materialIds)) {
      return res.status(400).json({ error: 'materialIds must be an array' });
    }

    const playlist = playlists.get(playlistId);

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    if (playlist.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    playlist.materialIds = materialIds;
    playlist.updatedAt = new Date().toISOString();

    playlists.set(playlistId, playlist);

    res.json({
      success: true,
      message: 'Playlist order updated successfully',
      data: playlist
    });

  } catch (error) {
    console.error('Reorder playlist error:', error);
    res.status(500).json({
      error: 'Failed to reorder playlist',
      message: error.message
    });
  }
});

// Удаление плейлиста
router.delete('/:playlistId', async (req, res) => {
  try {
    const { playlistId } = req.params;
    const userId = req.query.userId || 'anonymous';

    const playlist = playlists.get(playlistId);

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    if (playlist.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Мягкое удаление
    playlist.status = 'deleted';
    playlist.updatedAt = new Date().toISOString();
    playlists.set(playlistId, playlist);

    res.json({
      success: true,
      message: 'Playlist deleted successfully'
    });

  } catch (error) {
    console.error('Delete playlist error:', error);
    res.status(500).json({
      error: 'Failed to delete playlist',
      message: error.message
    });
  }
});

// Отметка о прослушивании плейлиста
router.post('/:playlistId/play', async (req, res) => {
  try {
    const { playlistId } = req.params;
    const userId = req.query.userId || 'anonymous';

    const playlist = playlists.get(playlistId);

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    // Увеличиваем счетчик прослушиваний
    playlist.playCount += 1;
    playlist.lastPlayed = new Date().toISOString();
    playlists.set(playlistId, playlist);

    res.json({
      success: true,
      data: {
        playCount: playlist.playCount,
        lastPlayed: playlist.lastPlayed
      }
    });

  } catch (error) {
    console.error('Play playlist error:', error);
    res.status(500).json({
      error: 'Failed to update play count',
      message: error.message
    });
  }
});

module.exports = router; 