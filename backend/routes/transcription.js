const express = require('express');
const transcriptionProcessor = require('../utils/transcriptionProcessor');
const audioService = require('../services/audioService');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { Transcription, Material } = require('../models');

const router = express.Router();

// Настройка multer для загрузки файлов
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const userId = req.body.userId || 'anonymous';
      const uploadDir = path.join(__dirname, '..', 'uploads', userId);
      
      // Создаем директорию, если она не существует
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const extension = path.extname(file.originalname);
      const fileName = `${timestamp}-${uuidv4().substring(0, 8)}${extension}`;
      cb(null, fileName);
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/flac', 'audio/ogg'];
    const allowedExtensions = ['.mp3', '.wav', '.m4a', '.flac', '.ogg'];
    
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const isValidType = allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension);
    
    if (isValidType) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Allowed: mp3, wav, m4a, flac, ogg'), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

// Ленивая загрузка gladiaService
let gladiaService = null;
function getGladiaService() {
  if (!gladiaService) {
    gladiaService = require('../services/gladiaService');
  }
  return gladiaService;
}

/**
 * @swagger
 * /api/transcription/start:
 *   post:
 *     summary: Запустить транскрипцию аудиофайла
 *     description: Загружает аудиофайл и запускает транскрипцию через Gladia API
 *     tags: [Transcription]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileName
 *             properties:
 *               fileName:
 *                 type: string
 *                 description: Имя загруженного аудиофайла
 *               userId:
 *                 type: string
 *                 description: ID пользователя (по умолчанию 'anonymous')
 *               options:
 *                 type: object
 *                 description: Дополнительные параметры для транскрибации
 *                 properties:
 *                   language:
 *                     type: string
 *                     description: Язык аудио (например, 'en', 'ru', 'pl')
 *                   translation:
 *                     type: boolean
 *                     description: Включить перевод
 *                   targetLanguages:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Целевые языки для перевода
 *     responses:
 *       200:
 *         description: Транскрипция запущена успешно
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
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: ID транскрипции
 *                     predictionId:
 *                       type: string
 *                       description: ID предсказания от Gladia API
 *                     status:
 *                       type: string
 *                       enum: [submitted, processing, completed, failed]
 *       400:
 *         description: Неверные параметры запроса
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Аудиофайл не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/start', async (req, res) => {
  try {
    const { fileName, userId = 'anonymous', options = {} } = req.body;

    if (!fileName) {
      return res.status(400).json({ error: 'fileName is required' });
    }

    const filePath = path.join(__dirname, '..', 'uploads', userId, fileName);
    
    if (!(await audioService.fileExists(filePath))) {
      return res.status(404).json({ error: 'Audio file not found' });
    }

    // Подготавливаем параметры для Gladia V2 API
    const gladiaOptions = {
      // Базовые параметры V2 API
      custom_vocabulary: false,
      detect_language: options.detect_language || true,
      enable_code_switching: false,
      code_switching_config: {
        languages: []
      },
      language: options.language && options.language !== "auto" ? options.language : undefined,
      callback: false,
      callback_config: {
        method: "POST"
      },
      subtitles: false,
      subtitles_config: {},
      diarization: options.diarization?.enable || true,
      diarization_config: {
        enhanced: options.diarization?.enhanced || false
      },
      translation: options.translation || true,
      translation_config: {
        target_languages: options.targetLanguages || ["en", "ru"],
        model: "enhanced",
        match_original_utterances: true,
        informal: false
      },
      summarization: options.summarization?.enable || true,
      summarization_config: {
        type: options.summarization?.type || "concise"
      },
      moderation: false,
      named_entity_recognition: false,
      chapterization: false,
      name_consistency: false,
      custom_spelling: false,
      structured_data_extraction: false,
      sentiment_analysis: false,
      audio_to_llm: false,
      sentences: options.sentences || true,
      display_mode: false,
      punctuation_enhanced: false,
      language_config: {
        languages: options.language ? [options.language] : [],
        code_switching: false
      }
    };

    // Запускаем транскрибацию
    const gladia = getGladiaService();
    const transcriptionResult = await gladia.transcribeAudio(filePath, gladiaOptions);

    // Создаем запись транскрипции
    const transcriptionData = {
      id: uuidv4(),
      gladiaId: transcriptionResult.id,
      originalFileName: fileName,
      userId: userId,
      status: 'submitted',
      language: options.language || 'en',
      full_transcript: '',
      count_of_speakers: 1,
      translation: [],
      sentences: [],
      options: gladiaOptions
    };

    // Сохраняем в базу данных
    const transcription = await Transcription.create(transcriptionData);
    console.log('📝 Transcription started:', transcription.id);

    res.json({
      success: true,
      message: 'Transcription started successfully',
      data: {
        id: transcription.id,
        predictionId: transcription.gladiaId,
        status: transcription.status
      }
    });

  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({
      error: 'Failed to transcribe audio',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/transcription/status/{predictionId}:
 *   get:
 *     summary: Получить статус транскрипции
 *     description: Проверяет статус асинхронной транскрипции по ID предсказания
 *     tags: [Transcription]
 *     parameters:
 *       - in: path
 *         name: predictionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID предсказания от Gladia API
 *     responses:
 *       200:
 *         description: Статус транскрипции
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
 *                     status:
 *                       type: string
 *                       enum: [pending, processing, completed, failed]
 *                     progress:
 *                       type: number
 *                       description: Прогресс в процентах
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/status/:predictionId', async (req, res) => {
  try {
    const { predictionId } = req.params;
    
    console.log(`🔍 [DEBUG] Checking status for predictionId: ${predictionId}`);
    
    // Находим транскрипцию в БД по predictionId
    const transcription = await Transcription.findOne({
      where: { gladiaId: predictionId }
    });

    if (!transcription) {
      console.log(`❌ [DEBUG] Transcription not found for predictionId: ${predictionId}`);
      return res.status(404).json({
        error: 'Transcription not found',
        message: 'No transcription found with this prediction ID'
      });
    }
    
    console.log(`✅ [DEBUG] Found transcription in DB:`, {
      id: transcription.id,
      status: transcription.status,
      gladiaId: transcription.gladiaId,
      hasSentences: !!transcription.sentences,
      hasTranslation: !!transcription.translation,
      hasFullTranscript: !!transcription.full_transcript
    });
    
    const gladia = getGladiaService();
    const status = await gladia.getTranscriptionResult(predictionId);
    
    console.log(`📊 [DEBUG] Gladia API response:`, {
      status: status.status,
      hasResult: !!status.result,
      resultKeys: status.result ? Object.keys(status.result) : null
    });
    
    // Маппинг статусов Gladia к нашим внутренним статусам
    let internalStatus = status.status;
    if (status.status === 'done') {
      internalStatus = 'completed';
    } else if (status.status === 'error') {
      internalStatus = 'failed';
    }
    
    console.log(`🔄 [DEBUG] Status mapping: ${status.status} -> ${internalStatus}`);
    
    // Обновляем статус в БД
    if (internalStatus !== transcription.status || (internalStatus === 'completed' && !transcription.sentences)) {
      console.log(`📝 [DEBUG] Need to update transcription in DB`);
      
      let updateData = {
        status: internalStatus
      };
      
      if (internalStatus === 'completed' && status.result) {
        console.log(`🎯 [DEBUG] Processing completed transcription result`);
        // Обрабатываем результат через transcriptionProcessor
        const processedData = transcriptionProcessor.processGladiaResponse({
          id: status.id,
          result: status.result,
          created_at: status.created_at,
          completed_at: status.completed_at
        });
        
        console.log(`🔧 [DEBUG] Processed data from transcriptionProcessor:`, {
          language: processedData.language,
          fullTranscriptLength: processedData.full_transcript?.length || 0,
          sentencesCount: processedData.sentences?.length || 0,
          translationCount: processedData.translation?.length || 0,
          countOfSpeakers: processedData.count_of_speakers
        });
        
        updateData = {
          ...updateData,
          language: processedData.language,
          full_transcript: processedData.full_transcript,
          count_of_speakers: processedData.count_of_speakers,
          translation: processedData.translation,
          sentences: processedData.sentences,
          duration: status.result.metadata?.audio_duration || null,
          summary: status.result.summarization?.results || null,
          diarization: status.result.diarization || null,
          metadata: status.result.metadata || null
        };
        
        console.log(`💾 [DEBUG] Final updateData:`, {
          status: updateData.status,
          language: updateData.language,
          fullTranscriptLength: updateData.full_transcript?.length || 0,
          sentencesCount: updateData.sentences?.length || 0,
          translationCount: updateData.translation?.length || 0,
          countOfSpeakers: updateData.count_of_speakers,
          hasDuration: !!updateData.duration,
          hasSummary: !!updateData.summary
        });

        const updatedTranscription = await transcription.update(updateData);
        console.log(`✅ [DEBUG] Transcription updated successfully:`, {
          id: updatedTranscription.id,
          status: updatedTranscription.status,
          hasSentences: !!updatedTranscription.sentences,
          hasTranslation: !!updatedTranscription.translation,
          hasFullTranscript: !!updatedTranscription.full_transcript
        });

        // Обновляем статус связанного материала на 'ready' ТОЛЬКО здесь
        try {
          console.log(`🔍 [DEBUG] Looking for material with transcriptionId: ${transcription.id}`);
          const material = await Material.findOne({
            where: { transcriptionId: transcription.id }
          });
          console.log(`📊 [DEBUG] Found material:`, material ? {
            id: material.id,
            status: material.status,
            transcriptionId: material.transcriptionId
          } : 'NOT FOUND');
          if (material) {
            let updated = false;
            // Обновление статуса и языка
            if (material.status === 'processing') {
              material.status = 'ready';
              updated = true;
            }
            if (material.language !== processedData.language) {
              material.language = processedData.language || 'unknown';
              updated = true;
            }
            // Авто-заполнение description из summary при каждом парсинге
            if (
              (!material.description || material.description.trim() === '') &&
              updateData.summary
            ) {
              material.description = updateData.summary;
              updated = true;
              console.log('[DEBUG] Material description auto-filled from transcription summary');
            }
            // Авто-заполнение duration при каждом парсинге
            if (
              (!material.duration || material.duration === 0) &&
              updateData.duration
            ) {
              material.duration = updateData.duration;
              updated = true;
              console.log('[DEBUG] Material duration auto-filled from transcription duration');
            }
            if (updated) {
              await material.save();
              console.log(`✅ [DEBUG] Material updated:`, { id: material.id, status: material.status, language: material.language, description: material.description });
            }
          } else {
            console.log(`❌ [DEBUG] No material found with transcriptionId: ${transcription.id}`);
          }
        } catch (materialError) {
          console.error('❌ [DEBUG] Failed to update material status:', materialError);
        }
      } else {
        // Если не completed или нет status.result, просто обновляем статус
        await transcription.update(updateData);
      }
    } else {
      console.log(`⏭️ [DEBUG] No update needed - status unchanged or already has data`);
    }
    
    res.json({
      success: true,
      data: {
        transcriptionId: transcription.id,
        status: internalStatus,
        result: internalStatus === 'completed' ? status.result : null
      }
    });

  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({
      error: 'Failed to get transcription status',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/transcription/{transcriptionId}:
 *   get:
 *     summary: Получить транскрипцию
 *     description: Возвращает обработанную транскрипцию по ID
 *     tags: [Transcription]
 *     parameters:
 *       - in: path
 *         name: transcriptionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID транскрипции
 *     responses:
 *       200:
 *         description: Данные транскрипции
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
 *                     id:
 *                       type: string
 *                     status:
 *                       type: string
 *                     originalFileName:
 *                       type: string
 *                     sourceLanguage:
 *                       type: string
 *                     targetLanguage:
 *                       type: string
 *                     duration:
 *                       type: number
 *                     sentences:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           text:
 *                             type: string
 *                           start:
 *                             type: number
 *                           end:
 *                             type: number
 *                           utterances:
 *                             type: array
 *                           translations:
 *                             type: array
 *                     summary:
 *                       type: string
 *                     translation:
 *                       type: array
 *                     diarization:
 *                       type: boolean
 *                     metadata:
 *                       type: object
 *                     createdAt:
 *                       type: string
 *                     updatedAt:
 *                       type: string
 *       404:
 *         description: Транскрипция не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:transcriptionId', async (req, res) => {
  try {
    const { transcriptionId } = req.params;

    // Загружаем транскрипцию из БД
    const transcription = await Transcription.findByPk(transcriptionId);

    if (!transcription) {
      return res.status(404).json({
        error: 'Transcription not found',
        message: 'No transcription found with this ID'
      });
    }

    // Адаптируем структуру данных под ожидания фронта
    const adaptedSentences = transcription.sentences ? transcription.sentences.map(sentence => ({
      id: sentence.id,
      text: sentence.sentence, // Переименовываем sentence в text
      start: sentence.start,
      end: sentence.end,
      speaker: sentence.speaker,
      confidence: sentence.utterances?.[0]?.confidence || 1.0, // Берем confidence из первого utterance
      translation: sentence.translation || []
    })) : [];

    const adaptedTranslation = transcription.translation ? transcription.translation.map(trans => ({
      language: trans.language,
      text: trans.text,
      confidence: 1.0 // Добавляем confidence
    })) : [];

    res.json({
      success: true,
      data: {
        id: transcription.id,
        status: transcription.status,
        originalFileName: transcription.originalFileName,
        sourceLanguage: transcription.language,
        targetLanguage: transcription.targetLanguage,
        language: transcription.language,
        full_transcript: transcription.full_transcript,
        count_of_speakers: transcription.count_of_speakers,
        translation: adaptedTranslation,
        sentences: adaptedSentences,
        duration: transcription.duration,
        summary: transcription.summary,
        diarization: transcription.diarization,
        metadata: transcription.metadata,
        createdAt: transcription.createdAt,
        updatedAt: transcription.updatedAt
      }
    });

  } catch (error) {
    console.error('Get transcription error:', error);
    res.status(500).json({
      error: 'Failed to get transcription',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/transcription/{transcriptionId}/sentences:
 *   put:
 *     summary: Обновить предложения транскрипции
 *     description: Обновляет границы и содержимое предложений транскрипции
 *     tags: [Transcription]
 *     parameters:
 *       - in: path
 *         name: transcriptionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID транскрипции
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sentenceEdits
 *             properties:
 *               sentenceEdits:
 *                 type: array
 *                 description: Массив изменений предложений
 *                 items:
 *                   type: object
 *                   properties:
 *                     sentenceId:
 *                       type: string
 *                     start:
 *                       type: number
 *                     end:
 *                       type: number
 *                     text:
 *                       type: string
 *                     translations:
 *                       type: array
 *               options:
 *                 type: object
 *                 description: Дополнительные опции обработки
 *     responses:
 *       200:
 *         description: Предложения успешно обновлены
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
 *                   type: object
 *                   properties:
 *                     transcriptionId:
 *                       type: string
 *                     updatedSentences:
 *                       type: array
 *       400:
 *         description: Ошибка валидации
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:transcriptionId/sentences', async (req, res) => {
  try {
    const { transcriptionId } = req.params;
    const { sentenceEdits, options = {} } = req.body;

    // Здесь должна быть логика:
    // 1. Загрузить транскрипцию из БД
    // 2. Применить изменения к предложениям
    // 3. Сохранить обновленную транскрипцию

    // Пока заглушка
    res.json({
      success: true,
      message: 'Sentences updated successfully',
      data: {
        transcriptionId: transcriptionId,
        updatedSentences: sentenceEdits
      }
    });

  } catch (error) {
    console.error('Update sentences error:', error);
    res.status(500).json({
      error: 'Failed to update sentences',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/transcription/{transcriptionId}/export:
 *   get:
 *     summary: Экспорт транскрипции
 *     description: Экспортирует транскрипцию в различных форматах
 *     tags: [Transcription]
 *     parameters:
 *       - in: path
 *         name: transcriptionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID транскрипции
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, srt, vtt, txt]
 *           default: json
 *         description: Формат экспорта
 *     responses:
 *       200:
 *         description: Экспортированная транскрипция
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
 *                     transcriptionId:
 *                       type: string
 *                     format:
 *                       type: string
 *       400:
 *         description: Неподдерживаемый формат
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:transcriptionId/export', async (req, res) => {
  try {
    const { transcriptionId } = req.params;
    const { format = 'json' } = req.query;

    // Здесь должна быть логика экспорта в разных форматах
    // JSON, SRT, VTT, TXT и т.д.

    switch (format.toLowerCase()) {
      case 'json':
        res.json({
          success: true,
          data: {
            transcriptionId: transcriptionId,
            format: 'json',
            // processedData будет загружена из БД
          }
        });
        break;
      
      case 'srt':
        // Генерация SRT файла
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="transcription-${transcriptionId}.srt"`);
        res.send('# SRT export not implemented yet');
        break;
      
      case 'vtt':
        // Генерация VTT файла
        res.setHeader('Content-Type', 'text/vtt');
        res.setHeader('Content-Disposition', `attachment; filename="transcription-${transcriptionId}.vtt"`);
        res.send('# VTT export not implemented yet');
        break;
      
      default:
        res.status(400).json({ error: 'Unsupported export format' });
    }

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      error: 'Failed to export transcription',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/transcription/result/{predictionId}:
 *   get:
 *     summary: Получить результат транскрипции
 *     description: Получает готовый результат транскрипции по ID предсказания от Gladia API
 *     tags: [Transcription]
 *     parameters:
 *       - in: path
 *         name: predictionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID предсказания от Gladia API
 *     responses:
 *       200:
 *         description: Результат транскрипции
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
 *                     id:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [done, processing, error]
 *                     result:
 *                       type: object
 *                       description: Полный результат от Gladia API
 *       404:
 *         description: Результат не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/result/:predictionId', async (req, res) => {
  try {
    const { predictionId } = req.params;
    
    const gladia = getGladiaService();
    const result = await gladia.getTranscriptionResult(predictionId);
    
    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get result error:', error);
    res.status(500).json({
      error: 'Failed to get transcription result',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/transcription/wait/{predictionId}:
 *   get:
 *     summary: Дождаться завершения транскрипции
 *     description: Ждет завершения транскрипции и возвращает готовый результат
 *     tags: [Transcription]
 *     parameters:
 *       - in: path
 *         name: predictionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID предсказания от Gladia API
 *       - in: query
 *         name: timeout
 *         schema:
 *           type: number
 *           default: 300
 *         description: Таймаут ожидания в секундах
 *     responses:
 *       200:
 *         description: Готовый результат транскрипции
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
 *                     id:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [done, error]
 *                     result:
 *                       type: object
 *                       description: Полный результат от Gladia API
 *       408:
 *         description: Таймаут ожидания
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/wait/:predictionId', async (req, res) => {
  try {
    const { predictionId } = req.params;
    const timeout = parseInt(req.query.timeout) || 300;
    
    const gladia = getGladiaService();
    const result = await gladia.waitForTranscription(predictionId, timeout * 1000);
    
    // ✅ Обработка данных и обновление БД
    if (result.status === 'done' && result.result) {
      const transcription = await Transcription.findOne({
        where: { gladiaId: predictionId }
      });
      
      if (transcription) {
        const processedData = transcriptionProcessor.processGladiaResponse({
          id: result.id,
          result: result.result,
          created_at: result.created_at,
          completed_at: result.completed_at
        });
        
        await transcription.update({
          status: 'completed',
          language: processedData.language,
          full_transcript: processedData.full_transcript,
          translation: processedData.translation,
          sentences: processedData.sentences,
          count_of_speakers: processedData.count_of_speakers,
          summary: processedData.summary,
          metadata: processedData.metadata
        });

        // 🔄 ОБНОВЛЯЕМ СТАТУС МАТЕРИАЛА
        const material = await Material.findOne({
          where: { transcriptionId: transcription.id }
        });

        if (material && material.status === 'processing') {
          await material.update({
            status: 'ready',
            duration: processedData.duration || null,
            estimatedTime: processedData.duration ? Math.ceil(processedData.duration / 60) : null
          });
          console.log(`✅ Material ${material.id} status updated to 'ready'`);
        }
      }
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Wait for transcription error:', error);
    
    if (error.message.includes('timeout')) {
      res.status(408).json({
        error: 'Transcription timeout',
        message: error.message
      });
    } else {
      res.status(500).json({
        error: 'Failed to wait for transcription',
        message: error.message
      });
    }
  }
});

/**
 * @swagger
 * /api/transcription/upload-and-transcribe:
 *   post:
 *     summary: Загрузить аудиофайл и запустить транскрипцию
 *     description: Загружает аудиофайл и сразу запускает транскрипцию через Gladia API
 *     tags: [Transcription]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - audio
 *             properties:
 *               audio:
 *                 type: string
 *                 format: binary
 *                 description: Аудиофайл для транскрипции
 *               userId:
 *                 type: string
 *                 description: ID пользователя (по умолчанию 'anonymous')
 *               options:
 *                 type: string
 *                 description: JSON строка с дополнительными параметрами
 *     responses:
 *       200:
 *         description: Транскрипция запущена успешно
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
 *                   type: object
 *                   properties:
 *                     transcriptionId:
 *                       type: string
 *                       description: ID транскрипции
 *                     predictionId:
 *                       type: string
 *                       description: ID предсказания от Gladia API
 *                     status:
 *                       type: string
 *                       enum: [submitted, processing, completed, failed]
 *       400:
 *         description: Неверные параметры запроса
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.post('/upload-and-transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const userId = req.body.userId || 'anonymous';
    const options = req.body.options ? JSON.parse(req.body.options) : {};

    console.log('📤 Uploading audio file to Gladia...');
    
    // Подготавливаем параметры для Gladia V2 API
    const gladiaOptions = {
      custom_vocabulary: false,
      detect_language: options.detect_language || true,
      enable_code_switching: false,
      code_switching_config: {
        languages: []
      },
      language: options.language && options.language !== "auto" ? options.language : undefined,
      callback: false,
      callback_config: {
        method: "POST"
      },
      subtitles: false,
      subtitles_config: {},
      diarization: options.diarization?.enable || true,
      diarization_config: {
        enhanced: options.diarization?.enhanced || false
      },
      translation: options.translation || true,
      translation_config: {
        target_languages: options.targetLanguages || ["en", "ru"],
        model: "enhanced",
        match_original_utterances: true,
        informal: false
      },
      summarization: options.summarization?.enable || true,
      summarization_config: {
        type: options.summarization?.type || "concise"
      },
      moderation: false,
      named_entity_recognition: false,
      chapterization: false,
      name_consistency: false,
      custom_spelling: false,
      structured_data_extraction: false,
      sentiment_analysis: false,
      audio_to_llm: false,
      sentences: options.sentences || true,
      display_mode: false,
      punctuation_enhanced: false,
      language_config: {
        languages: options.language ? [options.language] : [],
        code_switching: false
      }
    };

    // Запускаем транскрибацию
    const gladia = getGladiaService();
    const transcriptionResult = await gladia.transcribeAudio(req.file.path, gladiaOptions);

    // Создаем запись транскрипции
    const transcriptionData = {
      id: uuidv4(),
      gladiaId: transcriptionResult.id,
      originalFileName: req.file.originalname,
      fileName: req.file.filename,
      userId: userId,
      status: 'submitted',
      language: options.language || 'en',
      full_transcript: '',
      count_of_speakers: 1,
      translation: [],
      sentences: [],
      options: gladiaOptions
    };

    // Сохраняем в базу данных
    const transcription = await Transcription.create(transcriptionData);
    console.log('📝 Transcription started:', transcription.id);

    res.json({
      success: true,
      message: 'Transcription started successfully',
      data: {
        transcriptionId: transcription.id,
        predictionId: transcription.gladiaId,
        status: transcription.status
      }
    });

  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({
      error: 'Failed to transcribe audio',
      message: error.message
    });
  }
});

// Удаление транскрипции
router.delete('/:transcriptionId', async (req, res) => {
  try {
    const { transcriptionId } = req.params;

    // Здесь должна быть логика удаления из БД

    res.json({
      success: true,
      message: 'Transcription deleted successfully'
    });

  } catch (error) {
    console.error('Delete transcription error:', error);
    res.status(500).json({
      error: 'Failed to delete transcription',
      message: error.message
    });
  }
});

module.exports = router; 