const express = require('express');
const { v4: uuidv4 } = require('uuid');
const DescriptionService = require('../services/descriptionService');
const { Material } = require('../models');
const { sequelize } = require('../models');
const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();
const descriptionService = new DescriptionService();

/**
 * @swagger
 * /api/materials:
 *   post:
 *     summary: Создать новый материал
 *     description: Создает новый материал, объединяющий аудиофайл и транскрипцию
 *     tags: [Materials]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - audioFileName
 *               - transcriptionId
 *             properties:
 *               title:
 *                 type: string
 *                 description: Название материала
 *               description:
 *                 type: string
 *                 description: Описание материала
 *               audioFileName:
 *                 type: string
 *                 description: Имя аудиофайла
 *               transcriptionId:
 *                 type: string
 *                 description: ID транскрипции
 *               userId:
 *                 type: string
 *                 description: ID пользователя (по умолчанию 'anonymous')
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Теги для категоризации
 *               isPublic:
 *                 type: boolean
 *                 description: Публичный ли материал
 *               difficultyLevel:
 *                 type: string
 *                 enum: [A1, A2, B1, B2, C1, C2]
 *                 description: Уровень сложности материала по CEFR
 *               sourceLanguage:
 *                 type: string
 *                 description: Исходный язык материала
 *               targetLanguage:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Целевые языки материала
 *               duration:
 *                 type: string
 *                 description: Продолжительность материала
 *               estimatedTime:
 *                 type: string
 *                 description: Оцененное время изучения материала
 *               averageRating:
 *                 type: number
 *                 description: Средняя оценка материала
 *               ratingCount:
 *                 type: integer
 *                 description: Количество оценок материала
 *               category:
 *                 type: string
 *                 description: Категория материала
 *               author:
 *                 type: string
 *                 description: Автор материала
 *               recommendedRepetitions:
 *                 type: integer
 *                 description: Рекомендуемое количество повторений материала
 *     responses:
 *       201:
 *         description: Материал успешно создан
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
 *                   $ref: '#/components/schemas/Material'
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
      audioFileName,
      transcriptionId,
      userId = 'anonymous',
      tags = [],
      isPublic = false,
      difficultyLevel = 'B1',
      sourceLanguage,
      targetLanguage = [],
      duration,
      estimatedTime,
      averageRating = 0,
      ratingCount = 0,
      category,
      author,
      recommendedRepetitions = 3
    } = req.body;

    if (!title || !audioFileName || !transcriptionId) {
      return res.status(400).json({
        error: 'Missing required fields: title, audioFileName, transcriptionId'
      });
    }

    // Валидация уровня сложности
    const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    if (difficultyLevel && !validLevels.includes(difficultyLevel)) {
      return res.status(400).json({
        error: 'Invalid difficultyLevel. Must be one of: A1, A2, B1, B2, C1, C2'
      });
    }

    // Валидация языков
    const validLanguages = ['pl', 'en', 'ru', 'de', 'fr', 'es', 'it', 'pt', 'ja', 'ko', 'zh', 'ar'];
    if (sourceLanguage && !validLanguages.includes(sourceLanguage)) {
      return res.status(400).json({
        error: 'Invalid sourceLanguage. Must be a valid language code (pl, en, ru, etc.)'
      });
    }

    if (targetLanguage && Array.isArray(targetLanguage)) {
      const invalidTargetLanguages = targetLanguage.filter(lang => !validLanguages.includes(lang));
      if (invalidTargetLanguages.length > 0) {
        return res.status(400).json({
          error: `Invalid targetLanguage(s): ${invalidTargetLanguages.join(', ')}. Must be valid language codes.`
        });
      }
    }

    // Валидация рейтинга
    if (averageRating !== undefined && (averageRating < 0 || averageRating > 5)) {
      return res.status(400).json({
        error: 'Invalid averageRating. Must be between 0 and 5.'
      });
    }

    // Валидация количества повторений
    if (recommendedRepetitions !== undefined && (recommendedRepetitions < 1 || recommendedRepetitions > 20)) {
      return res.status(400).json({
        error: 'Invalid recommendedRepetitions. Must be between 1 and 20.'
      });
    }

    // Валидация длительности
    if (duration !== undefined && (duration < 0 || duration > 7200)) {
      return res.status(400).json({
        error: 'Invalid duration. Must be between 0 and 7200 seconds (2 hours).'
      });
    }

    // Валидация времени изучения
    if (estimatedTime !== undefined && (estimatedTime < 0 || estimatedTime > 480)) {
      return res.status(400).json({
        error: 'Invalid estimatedTime. Must be between 0 and 480 minutes (8 hours).'
      });
    }

    // Автоматическое получение описания, если не предоставлено
    let finalDescription = description;
    if (!finalDescription && (transcriptionId)) {
      try {
        console.log('🤖 Attempting to generate automatic description...');
        
        // Здесь можно загрузить данные транскрипции по transcriptionId
        let transcriptionData = null;
        // TODO: Загрузить данные транскрипции из файла или базы данных
        
        const autoDescription = await descriptionService.getAudioDescription(transcriptionData);
        
        if (autoDescription) {
          finalDescription = autoDescription.description;
          console.log(`✅ Auto-generated description: ${finalDescription.substring(0, 100)}...`);
        }
      } catch (error) {
        console.warn('⚠️ Failed to generate automatic description:', error.message);
      }
    }

    const materialId = uuidv4();
    const material = {
      id: materialId,
      title: title,
      description: finalDescription || '',
      audioFileName: audioFileName,
      transcriptionId: transcriptionId,
      userId: userId,
      tags: tags,
      isPublic: isPublic,
      difficultyLevel: difficultyLevel,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active', // active, archived, deleted
      playCount: 0,
      lastPlayed: null,
      sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage,
      duration: duration,
      estimatedTime: estimatedTime,
      averageRating: averageRating,
      ratingCount: ratingCount,
      category: category,
      author: author,
      recommendedRepetitions: recommendedRepetitions
    };

    await Material.create(material);

    res.status(201).json({
      success: true,
      message: 'Material created successfully',
      data: material
    });

  } catch (error) {
    console.error('Create material error:', error);
    res.status(500).json({
      error: 'Failed to create material',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/materials/drafts:
 *   get:
 *     summary: Получить черновики пользователя
 *     description: Возвращает все черновики и готовые к публикации материалы пользователя
 *     tags: [Materials]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: ID пользователя (по умолчанию 'anonymous')
 *     responses:
 *       200:
 *         description: Список черновиков
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Material'
 */
router.get('/drafts', async (req, res) => {
  try {
    const userId = req.query.userId || 'anonymous';

    const drafts = await Material.findAll({
      where: {
        userId,
        status: ['draft', 'processing', 'ready']
      },
      order: [['updatedAt', 'DESC']]
    });

    res.json({
      success: true,
      data: drafts
    });

  } catch (error) {
    console.error('Get drafts error:', error);
    res.status(500).json({
      error: 'Failed to get drafts',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/materials:
 *   get:
 *     summary: Получить список материалов пользователя
 *     description: Возвращает список материалов, принадлежащих пользователю
 *     tags: [Materials]
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
 *           enum: [draft, processing, ready, published, failed]
 *           default: published
 *         description: Статус материалов для фильтрации
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Количество материалов на странице
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Смещение для пагинации
 *     responses:
 *       200:
 *         description: Список материалов
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
 *                     materials:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Material'
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
    const { status = 'published', limit = 50, offset = 0 } = req.query;

    const userMaterials = await Material.findAll({
      where: {
        userId: userId,
        status: status
      },
      order: [['updatedAt', 'DESC']]
    });

    // Пагинация
    const paginatedMaterials = userMaterials.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
      success: true,
      data: {
        materials: paginatedMaterials,
        total: userMaterials.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({
      error: 'Failed to get materials',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/materials/drafts:
 *   get:
 *     summary: Получить черновики пользователя
 *     description: Возвращает все черновики и готовые к публикации материалы пользователя
 *     tags: [Materials]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: ID пользователя (по умолчанию anonymous)
 *     responses:
 *       200:
 *         description: Список черновиков
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: #/components/schemas/Material
 */
router.get("/drafts", async (req, res) => {
  try {
    const userId = req.query.userId || "anonymous";

    const drafts = await Material.findAll({
      where: {
        userId,
        status: ["draft", "processing", "ready"]
      },
      order: [["updatedAt", "DESC"]]
    });

    res.json({
      success: true,
      data: drafts
    });

  } catch (error) {
    console.error("Get drafts error:", error);
    res.status(500).json({
      error: "Failed to get drafts",
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/materials/public:
 *   get:
 *     summary: Получить публичные материалы
 *     description: Возвращает список публичных материалов всех пользователей
 *     tags: [Materials]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Количество материалов на странице
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Смещение для пагинации
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Фильтр по тегам (через запятую)
 *     responses:
 *       200:
 *         description: Список публичных материалов
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
 *                     materials:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Material'
 *                     total:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 */
router.get('/public', async (req, res) => {
  try {
    const { limit = 20, offset = 0, tags } = req.query;

    let publicMaterials = await Material.findAll({
      where: {
        isPublic: true,
        status: 'active'
      },
      order: [['createdAt', 'DESC']]
    });

    // Фильтрация по тегам
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
      publicMaterials = publicMaterials.filter(material =>
        material.tags && material.tags.some(tag => tagArray.includes(tag.toLowerCase()))
      );
    }

    // Пагинация
    const paginatedMaterials = publicMaterials.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
      success: true,
      data: {
        materials: paginatedMaterials,
        total: publicMaterials.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('Get public materials error:', error);
    res.status(500).json({
      error: 'Failed to get public materials',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/materials/search:
 *   get:
 *     summary: Поиск материалов
 *     description: Поиск материалов по названию, описанию и тегам
 *     tags: [Materials]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Поисковый запрос
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: ID пользователя (по умолчанию 'anonymous')
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Количество результатов на странице
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Смещение для пагинации
 *     responses:
 *       200:
 *         description: Результаты поиска
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
 *                     materials:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Material'
 *                     total:
 *                       type: integer
 *                     query:
 *                       type: string
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *       400:
 *         description: Отсутствует поисковый запрос
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/search', async (req, res) => {
  try {
    const { q, userId = 'anonymous', limit = 20, offset = 0 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const query = q.toLowerCase();
    
    // Получаем все материалы и фильтруем в JavaScript
    const allMaterials = await Material.findAll({
      where: {
        status: 'active',
        [sequelize.Op.or]: [
          { userId: userId },
          { isPublic: true }
        ]
      },
      order: [['updatedAt', 'DESC']]
    });

    // Фильтруем по поисковому запросу
    const searchResults = allMaterials.filter(material => {
      const titleMatch = material.title.toLowerCase().includes(query);
      const descriptionMatch = material.description.toLowerCase().includes(query);
      const tagsMatch = material.tags && material.tags.some(tag => 
        tag.toLowerCase().includes(query)
      );
      
      return titleMatch || descriptionMatch || tagsMatch;
    });

    // Пагинация
    const paginatedResults = searchResults.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
      success: true,
      data: {
        materials: paginatedResults,
        total: searchResults.length,
        query: q,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('Search materials error:', error);
    res.status(500).json({
      error: 'Failed to search materials',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/materials/{materialId}:
 *   get:
 *     summary: Получить материал по ID
 *     description: Возвращает конкретный материал по его ID
 *     tags: [Materials]
 *     parameters:
 *       - in: path
 *         name: materialId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID материала
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: ID пользователя (по умолчанию 'anonymous')
 *     responses:
 *       200:
 *         description: Данные материала
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Material'
 *       403:
 *         description: Доступ запрещен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Материал не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:materialId', async (req, res) => {
  try {
    const { materialId } = req.params;
    const userId = req.query.userId || 'anonymous';

    const material = await Material.findByPk(materialId);

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    // Проверяем права доступа
    if (!material.isPublic && material.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      data: material
    });

  } catch (error) {
    console.error('Get material error:', error);
    res.status(500).json({
      error: 'Failed to get material',
      message: error.message
    });
  }
});

// Обновление материала
router.put('/:materialId', async (req, res) => {
  try {
    const { materialId } = req.params;
    const userId = req.query.userId || 'anonymous';
    const {
      title,
      description,
      tags,
      isPublic,
      difficultyLevel,
      sourceLanguage,
      targetLanguage,
      duration,
      estimatedTime,
      averageRating,
      ratingCount,
      category,
      author,
      recommendedRepetitions,
      status
    } = req.body;

    const material = await Material.findByPk(materialId);

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    if (material.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Валидация уровня сложности
    if (difficultyLevel !== undefined) {
      const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
      if (!validLevels.includes(difficultyLevel)) {
        return res.status(400).json({
          error: 'Invalid difficultyLevel. Must be one of: A1, A2, B1, B2, C1, C2'
        });
      }
    }

    // Валидация языков
    const validLanguages = ['pl', 'en', 'ru', 'de', 'fr', 'es', 'it', 'pt', 'ja', 'ko', 'zh', 'ar'];
    if (sourceLanguage !== undefined && !validLanguages.includes(sourceLanguage)) {
      return res.status(400).json({
        error: 'Invalid sourceLanguage. Must be a valid language code (pl, en, ru, etc.)'
      });
    }

    if (targetLanguage !== undefined && Array.isArray(targetLanguage)) {
      const invalidTargetLanguages = targetLanguage.filter(lang => !validLanguages.includes(lang));
      if (invalidTargetLanguages.length > 0) {
        return res.status(400).json({
          error: `Invalid targetLanguage(s): ${invalidTargetLanguages.join(', ')}. Must be valid language codes.`
        });
      }
    }

    // Валидация рейтинга
    if (averageRating !== undefined && (averageRating < 0 || averageRating > 5)) {
      return res.status(400).json({
        error: 'Invalid averageRating. Must be between 0 and 5.'
      });
    }

    // Валидация количества повторений
    if (recommendedRepetitions !== undefined && (recommendedRepetitions < 1 || recommendedRepetitions > 20)) {
      return res.status(400).json({
        error: 'Invalid recommendedRepetitions. Must be between 1 and 20.'
      });
    }

    // Валидация длительности
    if (duration !== undefined && (duration < 0 || duration > 7200)) {
      return res.status(400).json({
        error: 'Invalid duration. Must be between 0 and 7200 seconds (2 hours).'
      });
    }

    // Валидация времени изучения
    if (estimatedTime !== undefined && (estimatedTime < 0 || estimatedTime > 480)) {
      return res.status(400).json({
        error: 'Invalid estimatedTime. Must be between 0 and 480 minutes (8 hours).'
      });
    }

    // Обновляем поля
    if (title !== undefined) material.title = title;
    if (description !== undefined) material.description = description;
    if (tags !== undefined) material.tags = tags;
    if (isPublic !== undefined) material.isPublic = isPublic;
    if (difficultyLevel !== undefined) material.difficultyLevel = difficultyLevel;
    if (sourceLanguage !== undefined) material.sourceLanguage = sourceLanguage;
    if (targetLanguage !== undefined) material.targetLanguage = targetLanguage;
    if (duration !== undefined) material.duration = duration;
    if (estimatedTime !== undefined) material.estimatedTime = estimatedTime;
    if (averageRating !== undefined) material.averageRating = averageRating;
    if (ratingCount !== undefined) material.ratingCount = ratingCount;
    if (category !== undefined) material.category = category;
    if (author !== undefined) material.author = author;
    if (recommendedRepetitions !== undefined) material.recommendedRepetitions = recommendedRepetitions;
    if (status !== undefined) material.status = status;
    
    material.updatedAt = new Date().toISOString();

    await material.save();

    res.json({
      success: true,
      message: 'Material updated successfully',
      data: material
    });

  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({
      error: 'Failed to update material',
      message: error.message
    });
  }
});

// Удаление материала
router.delete('/:materialId', async (req, res) => {
  try {
    const { materialId } = req.params;
    const userId = req.query.userId || 'anonymous';

    const material = await Material.findByPk(materialId);

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    if (material.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Мягкое удаление
    material.status = 'deleted';
    material.updatedAt = new Date().toISOString();
    await material.save();

    res.json({
      success: true,
      message: 'Material deleted successfully'
    });

  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({
      error: 'Failed to delete material',
      message: error.message
    });
  }
});

// Отметка о прослушивании материала
router.post('/:materialId/play', async (req, res) => {
  try {
    const { materialId } = req.params;
    const userId = req.query.userId || 'anonymous';

    const material = await Material.findByPk(materialId);

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    // Увеличиваем счетчик прослушиваний
    material.playCount += 1;
    material.lastPlayed = new Date().toISOString();
    await material.save();

    res.json({
      success: true,
      data: {
        playCount: material.playCount,
        lastPlayed: material.lastPlayed
      }
    });

  } catch (error) {
    console.error('Play material error:', error);
    res.status(500).json({
      error: 'Failed to update play count',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/materials/draft:
 *   post:
 *     summary: Создать черновик материала
 *     description: Создает черновик материала с базовой информацией (без файла)
 *     tags: [Materials]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - sourceLanguage
 *               - targetLanguage
 *             properties:
 *               title:
 *                 type: string
 *                 description: Название материала
 *               sourceLanguage:
 *                 type: string
 *                 description: Исходный язык
 *               targetLanguage:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Языки перевода
 *               userId:
 *                 type: string
 *                 description: ID пользователя (по умолчанию 'anonymous')
 *     responses:
 *       201:
 *         description: Черновик успешно создан
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
 *                   $ref: '#/components/schemas/Material'
 */
router.post('/draft', async (req, res) => {
  try {
    const {
      title,
      sourceLanguage,
      targetLanguage = [],
      userId = 'anonymous'
    } = req.body;

    if (!title || !sourceLanguage || !targetLanguage || targetLanguage.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields: title, sourceLanguage, targetLanguage'
      });
    }

    // Валидация языков
    const validLanguages = ['pl', 'en', 'ru', 'de', 'fr', 'es', 'it', 'pt', 'ja', 'ko', 'zh', 'ar'];
    if (!validLanguages.includes(sourceLanguage)) {
      return res.status(400).json({
        error: 'Invalid sourceLanguage. Must be a valid language code.'
      });
    }

    const invalidTargetLanguages = targetLanguage.filter(lang => !validLanguages.includes(lang));
    if (invalidTargetLanguages.length > 0) {
      return res.status(400).json({
        error: `Invalid targetLanguage(s): ${invalidTargetLanguages.join(', ')}. Must be valid language codes.`
      });
    }

    // Создаем черновик материала
    const material = await Material.create({
      id: uuidv4(),
      title,
      sourceLanguage,
      targetLanguage,
      userId,
      status: 'draft',
      audioFileName: null, // Будет заполнено при загрузке файла
      transcriptionId: null, // Будет заполнено при создании транскрипции
      tags: [],
      isPublic: false,
      difficultyLevel: 'B1',
      description: '',
      duration: null,
      estimatedTime: null,
      averageRating: 0,
      ratingCount: 0,
      category: '',
      author: '',
      recommendedRepetitions: 5,
      playCount: 0,
      lastPlayed: null
    });

    res.status(201).json({
      success: true,
      message: 'Draft material created successfully',
      data: material
    });

  } catch (error) {
    console.error('Create draft material error:', error);
    res.status(500).json({
      error: 'Failed to create draft material',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/materials/{materialId}/upload-file:
 *   put:
 *     summary: Загрузить файл и запустить транскрипцию
 *     description: Загружает аудиофайл к материалу и запускает транскрипцию
 *     tags: [Materials]
 *     parameters:
 *       - in: path
 *         name: materialId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID материала
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - audio
 */
router.put('/:materialId/upload-file', upload.single('audio'), async (req, res) => {
  try {
    const { materialId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Находим материал
    const material = await Material.findByPk(materialId);
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    if (material.status !== 'draft') {
      return res.status(400).json({ error: 'Can only upload file to draft materials' });
    }

    // Обновляем материал с именем файла
    material.audioFileName = req.file.filename;
    material.status = 'processing';
    await material.save();

    // Запускаем транскрипцию
    const gladia = require('../services/gladiaService');
    const gladiaOptions = {
      custom_vocabulary: false,
      detect_language: true,
      enable_code_switching: false,
      language: material.sourceLanguage,
      translation: true,
      translation_config: {
        target_languages: material.targetLanguage,
        model: "enhanced",
        match_original_utterances: true,
        informal: false
      },
      summarization: true,
      summarization_config: {
        type: "concise"
      },
      diarization: true,
      sentences: true
    };

    const transcriptionResult = await gladia.transcribeAudio(req.file.path, gladiaOptions);

    // Создаем запись транскрипции
    const { Transcription } = require('../models');
    const transcription = await Transcription.create({
      id: uuidv4(),
      gladiaId: transcriptionResult.id,
      originalFileName: req.file.originalname,
      fileName: req.file.filename,
      userId: material.userId,
      status: 'submitted',
      sourceLanguage: material.sourceLanguage,
      targetLanguage: material.targetLanguage[0] || 'en',
      language: material.sourceLanguage,
      full_transcript: '',
      count_of_speakers: 1,
      translation: [],
      sentences: [],
      options: gladiaOptions
    });

    // Обновляем материал с ID транскрипции
    material.transcriptionId = transcription.id;
    await material.save();

    res.json({
      success: true,
      message: 'File uploaded and transcription started',
      data: {
        materialId: material.id,
        predictionId: transcriptionResult.id,
        status: 'processing'
      }
    });

  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({
      error: 'Failed to upload file',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/materials/{materialId}/publish:
 *   put:
 *     summary: Опубликовать материал
 *     description: Публикует материал, меняя статус на 'published'
 *     tags: [Materials]
 *     parameters:
 *       - in: path
 *         name: materialId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID материала
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               difficultyLevel:
 *                 type: string
 *               category:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *               recommendedRepetitions:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Материал успешно опубликован
 */
router.put('/:materialId/publish', async (req, res) => {
  try {
    const { materialId } = req.params;
    const {
      title,
      description,
      tags,
      difficultyLevel,
      category,
      isPublic,
      recommendedRepetitions
    } = req.body;

    const material = await Material.findByPk(materialId);
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    if (material.status !== 'ready') {
      return res.status(400).json({ error: 'Can only publish materials with status "ready"' });
    }

    // Обновляем поля
    if (title !== undefined) material.title = title;
    if (description !== undefined) material.description = description;
    if (tags !== undefined) material.tags = tags;
    if (difficultyLevel !== undefined) material.difficultyLevel = difficultyLevel;
    if (category !== undefined) material.category = category;
    if (isPublic !== undefined) material.isPublic = isPublic;
    if (recommendedRepetitions !== undefined) material.recommendedRepetitions = recommendedRepetitions;

    // Публикуем материал
    material.status = 'published';
    await material.save();

    res.json({
      success: true,
      message: 'Material published successfully',
      data: material
    });

  } catch (error) {
    console.error('Publish material error:', error);
    res.status(500).json({
      error: 'Failed to publish material',
      message: error.message
    });
  }
});

module.exports = router; 