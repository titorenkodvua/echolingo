const express = require('express');
const multer = require('multer');
const path = require('path');
const audioService = require('../services/audioService');

const router = express.Router();

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'temp'));
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const uuid = require('uuid').v4().substring(0, 8);
    const ext = path.extname(file.originalname);
    cb(null, `upload-${timestamp}-${uuid}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  },
  fileFilter: (req, file, cb) => {
    if (audioService.isValidFormat(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Allowed: mp3, wav, m4a, flac, ogg'), false);
    }
  }
});

// Загрузка аудиофайла
router.post('/upload', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const userId = req.body.userId || 'anonymous';
    const title = req.body.title || req.file.originalname;
    const description = req.body.description || '';

    // Сохраняем файл
    const savedFile = await audioService.saveAudioFile(req.file, userId);

    // Получаем информацию об аудио
    const audioInfo = await audioService.getAudioInfo(savedFile.filePath);

    const audioData = {
      id: require('uuid').v4(),
      title: title,
      description: description,
      originalName: savedFile.originalName,
      fileName: savedFile.fileName,
      filePath: savedFile.filePath,
      size: savedFile.size,
      mimetype: savedFile.mimetype,
      duration: audioInfo.duration,
      format: audioInfo.format,
      bitrate: audioInfo.bitrate,
      sampleRate: audioInfo.sampleRate,
      channels: audioInfo.channels,
      codec: audioInfo.codec,
      userId: userId,
      createdAt: new Date().toISOString(),
      status: 'uploaded' // uploaded, processing, ready, error
    };

    res.json({
      success: true,
      message: 'Audio file uploaded successfully',
      data: audioData
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Failed to upload audio file',
      message: error.message
    });
  }
});

// Получение информации об аудиофайле
router.get('/info/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;
    const userId = req.query.userId || 'anonymous';
    
    const filePath = path.join(__dirname, '..', 'uploads', userId, fileName);
    
    if (!(await audioService.fileExists(filePath))) {
      return res.status(404).json({ error: 'Audio file not found' });
    }

    const audioInfo = await audioService.getAudioInfo(filePath);
    const fileSize = await audioService.getFileSize(filePath);

    res.json({
      success: true,
      data: {
        fileName: fileName,
        size: fileSize,
        ...audioInfo
      }
    });

  } catch (error) {
    console.error('Get audio info error:', error);
    res.status(500).json({
      error: 'Failed to get audio info',
      message: error.message
    });
  }
});

// Скачивание аудиофайла
router.get('/download/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;
    const userId = req.query.userId || 'anonymous';
    
    const filePath = path.join(__dirname, '..', 'uploads', userId, fileName);
    
    if (!(await audioService.fileExists(filePath))) {
      return res.status(404).json({ error: 'Audio file not found' });
    }

    res.download(filePath);

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      error: 'Failed to download audio file',
      message: error.message
    });
  }
});

// Удаление аудиофайла
router.delete('/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;
    const userId = req.query.userId || 'anonymous';
    
    const filePath = path.join(__dirname, '..', 'uploads', userId, fileName);
    
    if (!(await audioService.fileExists(filePath))) {
      return res.status(404).json({ error: 'Audio file not found' });
    }

    const deleted = await audioService.deleteFile(filePath);

    if (deleted) {
      res.json({
        success: true,
        message: 'Audio file deleted successfully'
      });
    } else {
      res.status(500).json({
        error: 'Failed to delete audio file'
      });
    }

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      error: 'Failed to delete audio file',
      message: error.message
    });
  }
});

// Создание сегмента аудио
router.post('/segment', async (req, res) => {
  try {
    const { fileName, startTime, duration, userId = 'anonymous' } = req.body;
    
    if (!fileName || startTime === undefined || !duration) {
      return res.status(400).json({
        error: 'Missing required parameters: fileName, startTime, duration'
      });
    }

    const inputPath = path.join(__dirname, '..', 'uploads', userId, fileName);
    
    if (!(await audioService.fileExists(inputPath))) {
      return res.status(404).json({ error: 'Audio file not found' });
    }

    const segmentFileName = `segment-${Date.now()}-${require('uuid').v4().substring(0, 8)}.mp3`;
    const outputPath = path.join(__dirname, '..', 'uploads', userId, segmentFileName);

    const segmentPath = await audioService.createAudioSegment(inputPath, outputPath, startTime, duration);

    res.json({
      success: true,
      data: {
        segmentFileName: segmentFileName,
        segmentPath: segmentPath,
        startTime: startTime,
        duration: duration
      }
    });

  } catch (error) {
    console.error('Create segment error:', error);
    res.status(500).json({
      error: 'Failed to create audio segment',
      message: error.message
    });
  }
});

module.exports = router; 