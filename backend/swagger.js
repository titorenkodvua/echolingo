const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Echolingo API',
      version: '1.0.0',
      description: 'API для сервиса изучения языков через технику Shadowing',
      contact: {
        name: 'Echolingo Team',
        email: 'support@echolingo.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        Material: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Уникальный идентификатор материала' },
            title: { type: 'string', description: 'Название материала' },
            description: { type: 'string', description: 'Описание материала' },
            audioFileName: { type: 'string', description: 'Имя аудиофайла' },
            transcriptionId: { type: 'string', description: 'ID транскрипции' },
            userId: { type: 'string', description: 'ID пользователя' },
            tags: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'Теги для категоризации'
            },
            isPublic: { type: 'boolean', description: 'Публичный ли материал' },
            difficultyLevel: { 
              type: 'string', 
              enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
              description: 'Уровень сложности материала по CEFR'
            },
            sourceLanguage: { 
              type: 'string', 
              description: 'Исходный язык материала (pl, en, ru, etc.)'
            },
            targetLanguage: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'Целевые языки для перевода'
            },
            duration: { 
              type: 'number', 
              description: 'Длительность в секундах'
            },
            estimatedTime: { 
              type: 'number', 
              description: 'Оценка времени изучения в минутах'
            },
            averageRating: { 
              type: 'number', 
              minimum: 0,
              maximum: 5,
              description: 'Средняя оценка (0-5)'
            },
            ratingCount: { 
              type: 'integer', 
              description: 'Количество оценок'
            },
            category: { 
              type: 'string', 
              description: 'Категория материала'
            },
            author: { 
              type: 'string', 
              description: 'Автор материала'
            },
            recommendedRepetitions: { 
              type: 'integer', 
              minimum: 1,
              maximum: 20,
              description: 'Рекомендуемое количество повторений для shadowing'
            },
            status: { type: 'string', description: 'Статус материала' },
            playCount: { type: 'integer', description: 'Количество прослушиваний' },
            lastPlayed: { type: 'string', format: 'date-time', description: 'Время последнего прослушивания' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Playlist: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            materials: {
              type: 'array',
              items: { type: 'string' }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        TranscriptionRequest: {
          type: 'object',
          properties: {
            audioFile: { type: 'string', format: 'binary' },
            language: { type: 'string' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js', './server.js']
};

const specs = swaggerJsdoc(options);

module.exports = specs; 