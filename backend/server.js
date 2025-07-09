const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swagger');
const { initializeDatabase } = require('./models');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Проверка состояния сервера
 *     description: Возвращает статус сервера и текущее время
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Сервер работает
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "OK"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Echolingo API Documentation'
}));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/audio', require('./routes/audio'));
app.use('/api/transcription', require('./routes/transcription'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/playlists', require('./routes/playlists'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Импортируем функцию polling из routes/materials.js
const { startTranscriptionPolling } = require('./routes/materials');

// Функция для восстановления polling незавершенных транскрипций
async function restorePollingOnStartup() {
  try {
    const { Transcription } = require('./models');
    
    // Находим все транскрипции в статусах 'pending' или 'processing'
    const pendingTranscriptions = await Transcription.findAll({
      where: {
        status: ['pending', 'processing', 'submitted']
      },
      attributes: ['gladiaId', 'status', 'createdAt']
    });

    console.log(`🔄 [STARTUP] Found ${pendingTranscriptions.length} pending/processing transcriptions`);

    for (const transcription of pendingTranscriptions) {
      // Проверяем, не слишком ли старая транскрипция (старше 1 часа)
      const createdAt = new Date(transcription.createdAt);
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      if (createdAt < hourAgo) {
        console.log(`⏰ [STARTUP] Skipping old transcription: ${transcription.gladiaId} (${transcription.status})`);
        continue;
      }

      console.log(`🤖 [STARTUP] Restoring polling for: ${transcription.gladiaId} (${transcription.status})`);
      startTranscriptionPolling(transcription.gladiaId, 'normal');
    }
  } catch (error) {
    console.error('❌ [STARTUP] Failed to restore polling:', error);
  }
}

// Запуск cron-задачи для автоматической очистки неоконченных материалов
require('./cron/cleanupJob');

// Инициализация и запуск сервера
const startServer = async () => {
  try {
    // Инициализируем базу данных
    await initializeDatabase();
    
    // Восстанавливаем polling для незавершенных транскрипций
    await restorePollingOnStartup();
    
    // Запускаем сервер
    app.listen(PORT, () => {
      console.log(`🚀 Echolingo server running on port ${PORT}`);
      console.log(`📁 Uploads directory: ${path.join(__dirname, 'uploads')}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`🗄️  Database: ${path.join(__dirname, 'database/echolingo.sqlite')}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 