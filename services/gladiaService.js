const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

class GladiaService {
  constructor() {
    this.baseURL = 'https://api.gladia.io';
  }

  getApiKey() {
    const apiKey = process.env.GLADIA_API_KEY;
    if (!apiKey) {
      throw new Error('GLADIA_API_KEY is required in environment variables');
    }
    return apiKey;
  }

  async transcribeAudio(audioFilePath, options = {}) {
    try {
      const apiKey = this.getApiKey();
      const formData = new FormData();
      
      // Добавляем аудиофайл
      formData.append('audio', fs.createReadStream(audioFilePath));
      
      // Базовые параметры для транскрибации
      const defaultParams = {
        language_behaviour: 'automatic single language',
        output_format: 'json',
        diarization: 'true',
        smart_format: 'true',
        diarization_config: JSON.stringify({
          number_of_speakers: -1, // Автоопределение
          min_speakers: 1,
          max_speakers: 10
        }),
        translation: 'true',
        translation_config: JSON.stringify({
          target_languages: ['en', 'ru'], // Английский и русский
          source_language: 'auto'
        })
      };

      // Объединяем с пользовательскими параметрами
      const params = { ...defaultParams, ...options };
      
      // Добавляем параметры в formData
      Object.keys(params).forEach(key => {
        formData.append(key, params[key]);
      });

      const response = await axios.post(
        `${this.baseURL}/audio/text/audio-transcription/`,
        formData,
        {
          headers: {
            'x-gladia-key': apiKey,
            ...formData.getHeaders()
          },
          timeout: 300000 // 5 минут таймаут
        }
      );

      return response.data;
    } catch (error) {
      console.error('Gladia API error:', error.response?.data || error.message);
      throw new Error(`Transcription failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async getTranscriptionStatus(predictionId) {
    try {
      const apiKey = this.getApiKey();
      const response = await axios.get(
        `${this.baseURL}/audio/text/audio-transcription/${predictionId}/`,
        {
          headers: {
            'x-gladia-key': apiKey
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting transcription status:', error.response?.data || error.message);
      throw new Error(`Failed to get transcription status: ${error.response?.data?.message || error.message}`);
    }
  }
}

module.exports = new GladiaService(); 