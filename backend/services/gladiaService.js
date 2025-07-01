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

  async uploadAudio(audioFilePath) {
    try {
      const apiKey = this.getApiKey();
      const formData = new FormData();
      
      // Добавляем аудиофайл
      formData.append('audio', fs.createReadStream(audioFilePath));
      
      const response = await axios.post(
        `${this.baseURL}/v2/upload`,
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
      console.error('Gladia upload error:', error.response?.data || error.message);
      throw new Error(`Upload failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async transcribeAudio(audioFilePath, options = {}) {
    try {
      const apiKey = this.getApiKey();
      
      // Сначала загружаем файл
      console.log('📤 Uploading audio file to Gladia...');
      const uploadResult = await this.uploadAudio(audioFilePath);
      const audioUrl = uploadResult.audio_url;
      
      console.log('✅ File uploaded successfully');
      console.log('🎵 Audio URL:', audioUrl);
      
      // Точные параметры для транскрибации V2 API
      const defaultParams = {
        audio_url: audioUrl,
        callback: false,
        sentences: true,
        subtitles: false,
        moderation: false,
        diarization: true,
        translation: true,
        audio_to_llm: false,
        display_mode: false,
        summarization: true,
        audio_enhancer: true,
        chapterization: false,
        custom_spelling: false,
        detect_language: true,
        language_config: {
          languages: [],
          code_switching: false
        },
        name_consistency: false,
        subtitles_config: {
          style: "default",
          formats: ["srt"]
        },
        custom_vocabulary: false,
        diarization_config: {
          enhanced: true
        },
        sentiment_analysis: false,
        translation_config: {
          model: "enhanced",
          context: "",
          lipsync: true,
          informal: false,
          target_languages: ["ru", "en", "it"],
          context_adaptation: true,
          match_original_utterances: true
        },
        diarization_enhanced: false,
        punctuation_enhanced: false,
        summarization_config: {
          type: "concise"
        },
        enable_code_switching: false,
        named_entity_recognition: false,
        speaker_reidentification: false,
        accurate_words_timestamps: false,
        skip_channel_deduplication: false,
        structured_data_extraction: false
      };

      // Объединяем с пользовательскими параметрами (если есть)
      const params = { ...defaultParams, ...options };
      
      console.log('🎤 Starting transcription with V2 API...');
      
      const response = await axios.post(
        `${this.baseURL}/v2/pre-recorded`,
        params,
        {
          headers: {
            'x-gladia-key': apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 300000 // 5 минут таймаут
        }
      );

      console.log('✅ Transcription request submitted');
      console.log('🆔 Prediction ID:', response.data.id);
      
      return {
        id: response.data.id,
        result_url: response.data.result_url,
        status: 'submitted'
      };
    } catch (error) {
      console.error('Gladia API error:', error.response?.data || error.message);
      throw new Error(`Transcription failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async getTranscriptionResult(predictionId) {
    try {
      const apiKey = this.getApiKey();
      const response = await axios.get(
        `${this.baseURL}/v2/pre-recorded/${predictionId}`,
        {
          headers: {
            'x-gladia-key': apiKey
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting transcription result:', error.response?.data || error.message);
      throw new Error(`Failed to get transcription result: ${error.response?.data?.message || error.message}`);
    }
  }

  async waitForTranscription(predictionId, maxWaitTime = 300000) { // 5 минут по умолчанию
    const startTime = Date.now();
    const pollInterval = 5000; // 5 секунд
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const result = await this.getTranscriptionResult(predictionId);
        
        if (result.status === 'done') {
          console.log('✅ Transcription completed successfully');
          return result;
        } else if (result.status === 'error') {
          throw new Error(`Transcription failed: ${result.error || 'Unknown error'}`);
        } else {
          console.log(`⏳ Transcription status: ${result.status} (${Math.round((Date.now() - startTime) / 1000)}s elapsed)`);
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
      } catch (error) {
        if (error.message.includes('Failed to get transcription result')) {
          console.log('⏳ Waiting for transcription to start...');
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        } else {
          throw error;
        }
      }
    }
    
    throw new Error('Transcription timeout - exceeded maximum wait time');
  }

  // Метод для полного процесса транскрибации (загрузка + транскрибация + ожидание результата)
  async transcribeAudioComplete(audioFilePath, options = {}) {
    console.log('🚀 Starting complete transcription process...');
    
    // Запускаем транскрибацию
    const transcription = await this.transcribeAudio(audioFilePath, options);
    
    // Ждем результата
    const result = await this.waitForTranscription(transcription.id);
    
    return result;
  }
}

module.exports = new GladiaService(); 