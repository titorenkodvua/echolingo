class DescriptionService {
  constructor() {
    // Убираем YouTube API key - он не нужен
  }

  /**
   * Получить описание из Gladia API (на основе транскрипции)
   */
  async getDescriptionFromGladia(transcriptionData) {
    try {
      if (!transcriptionData || !transcriptionData.summarization) {
        return null;
      }

      // Проверяем разные форматы ответа Gladia
      let summary = null;
      
      if (typeof transcriptionData.summarization === 'string') {
        // Прямая строка с описанием
        summary = transcriptionData.summarization;
      } else if (transcriptionData.summarization.results) {
        // Объект с результатами
        summary = transcriptionData.summarization.results;
      } else if (transcriptionData.summarization.summary) {
        // Альтернативный формат
        summary = transcriptionData.summarization.summary;
      }

      if (summary && summary.trim()) {
        return {
          source: 'gladia',
          description: summary.trim(),
          confidence: 0.9
        };
      }

      return null;
    } catch (error) {
      console.error('Error extracting description from Gladia:', error);
      return null;
    }
  }

  /**
   * Сгенерировать описание на основе транскрипции (если нет готового)
   */
  async generateDescriptionFromTranscription(transcriptionData) {
    try {
      if (!transcriptionData || !transcriptionData.transcription) {
        return null;
      }

      // Извлекаем текст из транскрипции
      const utterances = transcriptionData.transcription.utterances || [];
      const text = utterances.map(u => u.text).join(' ').trim();

      if (!text) {
        return null;
      }

      // Простая логика генерации описания
      const words = text.split(' ').slice(0, 20); // Первые 20 слов
      const summary = words.join(' ') + (words.length >= 20 ? '...' : '');

      return {
        source: 'generated',
        description: summary,
        confidence: 0.7
      };
    } catch (error) {
      console.error('Error generating description from transcription:', error);
      return null;
    }
  }

  /**
   * Получить описание аудио из транскрипции
   */
  async getAudioDescription(transcriptionData) {
    const descriptions = [];

    // 1. Пробуем получить из Gladia (если есть данные транскрипции)
    if (transcriptionData) {
      const gladiaDesc = await this.getDescriptionFromGladia(transcriptionData);
      if (gladiaDesc) {
        descriptions.push(gladiaDesc);
      }
    }

    // 2. Генерируем из транскрипции (если нет готового)
    if (transcriptionData && descriptions.length === 0) {
      const generatedDesc = await this.generateDescriptionFromTranscription(transcriptionData);
      if (generatedDesc) {
        descriptions.push(generatedDesc);
      }
    }

    // Возвращаем лучшее описание
    if (descriptions.length > 0) {
      // Сортируем по уверенности
      descriptions.sort((a, b) => b.confidence - a.confidence);
      return descriptions[0];
    }

    return null;
  }

  /**
   * Получить все доступные описания
   */
  async getAllDescriptions(transcriptionData) {
    const descriptions = [];

    // Собираем все описания
    if (transcriptionData) {
      const gladiaDesc = await this.getDescriptionFromGladia(transcriptionData);
      if (gladiaDesc) {
        descriptions.push(gladiaDesc);
      }
    }

    if (transcriptionData) {
      const generatedDesc = await this.generateDescriptionFromTranscription(transcriptionData);
      if (generatedDesc) {
        descriptions.push(generatedDesc);
      }
    }

    return descriptions;
  }

  /**
   * Объединить несколько описаний в одно
   */
  combineDescriptions(descriptions) {
    if (!descriptions || descriptions.length === 0) {
      return null;
    }

    if (descriptions.length === 1) {
      return descriptions[0];
    }

    // Сортируем по уверенности
    descriptions.sort((a, b) => b.confidence - a.confidence);

    // Берем лучшее описание
    const best = descriptions[0];

    // Если есть дополнительные источники, добавляем информацию
    if (descriptions.length > 1) {
      const sources = descriptions.map(d => d.source).join(', ');
      return {
        ...best,
        description: `${best.description} (Источники: ${sources})`,
        allSources: descriptions
      };
    }

    return best;
  }
}

module.exports = DescriptionService; 