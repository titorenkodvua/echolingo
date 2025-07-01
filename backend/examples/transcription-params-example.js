// Пример параметров для /api/transcription/start
// Используется с существующим файлом: 1751056452334-0c835ee4.mp3

const transcriptionParams = {
  // Обязательный параметр - имя файла
  fileName: "1751056452334-0c835ee4.mp3",
  
  // ID пользователя (опционально, по умолчанию 'anonymous')
  userId: "string", // файл находится в папке backend/uploads/string/
  
  // Дополнительные опции (опционально)
  options: {
    // Язык аудио
    language: "auto", // автоматическое определение или "en", "ru", "pl", etc.
    
    // Включить перевод
    translation: true,
    
    // Целевые языки для перевода
    targetLanguages: ["en", "ru"],
    
    // Диаризация (разделение по говорящим)
    diarization: {
      enable: true,
      enableSpeakerDiarization: true,
      enableSpeakerIdentification: true
    },
    
    // Суммирование
    summarization: {
      enable: true,
      summaryType: "paragraph"
    },
    
    // Ключевые слова
    keywords: {
      enable: true
    },
    
    // Темы
    topics: {
      enable: true
    }
  }
};

// Пример использования с curl:
/*
curl -X POST http://localhost:3001/api/transcription/start \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "1751056452334-0c835ee4.mp3",
    "userId": "string",
    "options": {
      "language": "auto",
      "translation": true,
      "targetLanguages": ["en", "ru"],
      "diarization": {
        "enable": true,
        "enableSpeakerDiarization": true,
        "enableSpeakerIdentification": true
      },
      "summarization": {
        "enable": true,
        "summaryType": "paragraph"
      },
      "keywords": {
        "enable": true
      },
      "topics": {
        "enable": true
      }
    }
  }'
*/

// Пример использования с JavaScript/Node.js:
/*
const axios = require('axios');

async function startTranscription() {
  try {
    const response = await axios.post('http://localhost:3001/api/transcription/start', transcriptionParams);
    console.log('Транскрибация запущена:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('Ошибка:', error.response?.data || error.message);
  }
}

startTranscription();
*/

// Минимальные параметры (только обязательные):
const minimalParams = {
  fileName: "1751056452334-0c835ee4.mp3"
};

// Параметры с базовыми опциями:
const basicParams = {
  fileName: "1751056452334-0c835ee4.mp3",
  userId: "string",
  options: {
    language: "auto",
    translation: true,
    targetLanguages: ["en"]
  }
};

module.exports = {
  transcriptionParams,
  minimalParams,
  basicParams
}; 