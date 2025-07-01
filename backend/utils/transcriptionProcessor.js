const { v4: uuidv4 } = require('uuid');

/**
 * Преобразует сырой JSON ответ от Gladia API в нашу внутреннюю структуру данных
 * @param {Object} gladiaResponse - Сырой ответ от Gladia API
 * @returns {Object} - Структурированные данные в формате Echolingo
 */
function processGladiaResponse(gladiaResponse) {
  try {
    console.log('🔄 Processing Gladia response to Echolingo format...');
    console.log('📊 [DEBUG] Gladia response structure:', {
      hasResult: !!gladiaResponse.result,
      resultKeys: gladiaResponse.result ? Object.keys(gladiaResponse.result) : null,
      hasTranscription: !!gladiaResponse.result?.transcription,
      hasTranslation: !!gladiaResponse.result?.translation,
      hasSentences: !!gladiaResponse.result?.sentences
    });
    // Логируем весь ответ для отладки
    console.log('[DEBUG] Full Gladia response:', JSON.stringify(gladiaResponse, null, 2));
    
    const result = gladiaResponse.result;
    if (!result) {
      throw new Error('No result data in Gladia response');
    }

    // Определяем язык оригинала через универсальный парсер
    const originalLanguage = extractLanguage(gladiaResponse);
    
    // Получаем полный текст
    const fullTranscript = result.transcription?.full_transcript || '';
    
    // Определяем количество говорящих
    const speakers = new Set();
    if (result.transcription?.utterances) {
      result.transcription.utterances.forEach(utterance => {
        if (utterance.speaker !== undefined) {
          speakers.add(utterance.speaker);
        }
      });
    }
    const countOfSpeakers = speakers.size;

    // Обрабатываем переводы
    const translations = [];
    console.log('🔍 [DEBUG] Processing translations:', {
      hasTranslationResults: !!result.translation?.results,
      translationResultsCount: result.translation?.results?.length || 0
    });
    
    if (result.translation?.results) {
      result.translation.results.forEach((translationResult, index) => {
        console.log(`🔍 [DEBUG] Translation result ${index}:`, {
          hasLanguages: !!translationResult.languages,
          languages: translationResult.languages,
          hasFullTranscript: !!translationResult.full_transcript,
          fullTranscriptLength: translationResult.full_transcript?.length || 0
        });
        
        if (translationResult.languages && translationResult.languages.length > 0) {
          const language = translationResult.languages[0];
          const translationText = translationResult.full_transcript || '';
          translations.push({
            id: `trans-${index + 1}`,
            language: language,
            text: translationText
          });
        }
      });
    }

    // Обрабатываем предложения
    const sentences = [];
    console.log('🔍 [DEBUG] Processing sentences:', {
      hasTranscriptionSentences: !!result.transcription?.sentences,
      transcriptionSentencesCount: result.transcription?.sentences?.length || 0,
      hasSentences: !!result.sentences,
      sentencesCount: result.sentences?.length || 0
    });
    
    // Проверяем разные возможные источники предложений
    let sentencesSource = result.transcription?.sentences || result.sentences || [];
    
    if (sentencesSource.length > 0) {
      sentencesSource.forEach((sentence, sentenceIndex) => {
        console.log(`🔍 [DEBUG] Processing sentence ${sentenceIndex}:`, {
          hasSentence: !!sentence.sentence,
          sentenceLength: sentence.sentence?.length || 0,
          hasStart: !!sentence.start,
          hasEnd: !!sentence.end
        });
        
        const sentenceId = `sent-${sentenceIndex + 1}`;
        
        // Находим переводы для этого предложения
        const sentenceTranslations = [];
        if (result.translation?.results) {
          result.translation.results.forEach((translationResult, transIndex) => {
            if (translationResult.sentences && translationResult.sentences[sentenceIndex]) {
              const language = translationResult.languages?.[0];
              if (language) {
                sentenceTranslations.push({
                  id: `${sentenceId}-tr-${transIndex + 1}`,
                  language: language,
                  text: translationResult.sentences[sentenceIndex].sentence || ''
                });
              }
            }
          });
        }

        // Находим уттеренсы для этого предложения
        const utterances = [];
        if (result.transcription?.utterances) {
          result.transcription.utterances.forEach((utterance, utteranceIndex) => {
            // Проверяем, принадлежит ли уттеренс к этому предложению
            if (utterance.start >= sentence.start && utterance.end <= sentence.end) {
              const utteranceId = `${sentenceId}-utt-${utteranceIndex + 1}`;
              
              // Находим переводы для этого уттеренса
              const utteranceTranslations = [];
              if (result.translation?.results) {
                result.translation.results.forEach((translationResult, transIndex) => {
                  if (translationResult.utterances && translationResult.utterances[utteranceIndex]) {
                    const language = translationResult.languages?.[0];
                    if (language) {
                      utteranceTranslations.push({
                        id: `${utteranceId}-tr-${transIndex + 1}`,
                        language: language,
                        text: translationResult.utterances[utteranceIndex].text || ''
                      });
                    }
                  }
                });
              }

              const processedUtterance = {
                id: utteranceId,
                is_segment_start: utteranceIndex === 0, // Первый уттеренс в предложении
                speaker: utterance.speaker || 0,
                text: utterance.text || '',
                start: utterance.start,
                end: utterance.end,
                confidence: utterance.confidence || 0,
                translation: utteranceTranslations
              };

              utterances.push(processedUtterance);
            }
          });
        }

        sentences.push({
          id: sentenceId,
          sentence: sentence.sentence || '',
          speaker: sentence.speaker || 0,
          start: sentence.start,
          end: sentence.end,
          translation: sentenceTranslations,
          utterances: utterances
        });
      });
    }

    // Создаем финальную структуру
    const processedTranscription = {
      id: gladiaResponse.id || uuidv4(),
      language: originalLanguage,
      full_transcript: fullTranscript,
      count_of_speakers: countOfSpeakers,
      translation: translations,
      sentences: sentences,
      metadata: {
        gladia_id: gladiaResponse.id,
        created_at: gladiaResponse.created_at,
        completed_at: gladiaResponse.completed_at,
        audio_duration: result.metadata?.audio_duration,
        transcription_time: result.metadata?.transcription_time,
        summarization: result.summarization?.results || null
      }
    };

    console.log('✅ Successfully processed transcription:');
    console.log(`   - Language: ${originalLanguage}`);
    console.log(`   - Speakers: ${countOfSpeakers}`);
    console.log(`   - Sentences: ${sentences.length}`);
    console.log(`   - Translations: ${translations.length} languages`);
    console.log(`   - Total utterances: ${sentences.reduce((sum, s) => sum + s.utterances.length, 0)}`);
    
    console.log('🔍 [DEBUG] Final processed data structure:', {
      translationLength: processedTranscription.translation.length,
      sentencesLength: processedTranscription.sentences.length,
      translationSample: processedTranscription.translation.slice(0, 2),
      sentencesSample: processedTranscription.sentences.slice(0, 2)
    });

    return processedTranscription;

  } catch (error) {
    console.error('❌ Error processing Gladia response:', error);
    throw error;
  }
}

/**
 * Создает уникальный ID для элемента
 * @param {string} prefix - Префикс ID
 * @param {number} index - Индекс
 * @returns {string} - Уникальный ID
 */
function generateId(prefix, index) {
  return `${prefix}-${index + 1}`;
}

/**
 * Валидирует структуру данных
 * @param {Object} transcription - Обработанная транскрипция
 * @returns {boolean} - Результат валидации
 */
function validateTranscription(transcription) {
  const requiredFields = ['language', 'full_transcript', 'count_of_speakers', 'translation', 'sentences'];
  
  for (const field of requiredFields) {
    if (!transcription.hasOwnProperty(field)) {
      console.error(`❌ Missing required field: ${field}`);
      return false;
    }
  }

  if (!Array.isArray(transcription.sentences)) {
    console.error('❌ Sentences must be an array');
    return false;
  }

  if (!Array.isArray(transcription.translation)) {
    console.error('❌ Translation must be an array');
    return false;
  }

  console.log('✅ Transcription validation passed');
  return true;
}

/**
 * Утилита для обработки и преобразования данных транскрипции
 * от Gladia API в структуру данных согласно data.js
 */

/**
 * Преобразует данные от Gladia API в нашу структуру данных
 * @param {Object} gladiaResult - Результат от Gladia API
 * @returns {Object} - Структура данных согласно data.js
 */
function processGladiaTranscription(gladiaResult) {
  try {
    const { prediction, result } = gladiaResult;
    
    if (!result || !result.transcription) {
      throw new Error('Нет данных транскрипции в результате Gladia');
    }

    const transcription = result.transcription;
    const segments = transcription.segments || [];
    
    // Определяем язык из метаданных или по умолчанию
    const language = transcription.language || 'en';
    
    // Собираем полный текст
    const full_transcript = segments.map(segment => segment.text).join(' ');
    
    // Определяем количество говорящих
    const speakers = new Set(segments.map(segment => segment.speaker).filter(s => s !== undefined));
    const count_of_speakers = speakers.size || 1;
    
    // Группируем сегменты по предложениям
    const sentences = groupSegmentsIntoSentences(segments);
    
    // Создаем переводы (пока пустые, будут заполнены позже)
    const translation = [];
    
    return {
      language,
      full_transcript,
      count_of_speakers,
      translation,
      sentences
    };
  } catch (error) {
    console.error('Ошибка обработки транскрипции Gladia:', error);
    throw error;
  }
}

/**
 * Группирует сегменты в предложения согласно структуре data.js
 * @param {Array} segments - Сегменты от Gladia API
 * @returns {Array} - Массив предложений
 */
function groupSegmentsIntoSentences(segments) {
  if (!segments || segments.length === 0) {
    return [];
  }

  const sentences = [];
  let currentSentence = null;
  let sentenceId = 1;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    
    // Определяем, является ли сегмент началом нового предложения
    const isSentenceStart = isSegmentStart(segment, i, segments);
    
    if (isSentenceStart && currentSentence) {
      // Завершаем текущее предложение
      sentences.push(currentSentence);
      sentenceId++;
    }
    
    if (isSentenceStart || !currentSentence) {
      // Начинаем новое предложение
      currentSentence = {
        id: `sent-${sentenceId}`,
        sentence: segment.text,
        speaker: segment.speaker || 1,
        start: segment.start,
        end: segment.end,
        translation: [],
        utterances: []
      };
    } else {
      // Добавляем к текущему предложению
      currentSentence.sentence += ' ' + segment.text;
      currentSentence.end = segment.end;
    }
    
    // Добавляем utterance (фразу)
    const utterance = {
      id: `utt-${sentenceId}-${currentSentence.utterances.length + 1}`,
      is_segment_start: isSegmentStart(segment, i, segments),
      speaker: segment.speaker || 1,
      text: segment.text,
      start: segment.start,
      end: segment.end,
      confidence: segment.confidence || 0.9,
      translation: []
    };
    
    currentSentence.utterances.push(utterance);
  }
  
  // Добавляем последнее предложение
  if (currentSentence) {
    sentences.push(currentSentence);
  }
  
  return sentences;
}

/**
 * Определяет, является ли сегмент началом нового предложения
 * @param {Object} segment - Текущий сегмент
 * @param {number} index - Индекс сегмента
 * @param {Array} segments - Все сегменты
 * @returns {boolean} - true если это начало предложения
 */
function isSegmentStart(segment, index, segments) {
  // Первый сегмент всегда начало
  if (index === 0) return true;
  
  const prevSegment = segments[index - 1];
  
  // Если сменился говорящий
  if (segment.speaker !== prevSegment.speaker) return true;
  
  // Если есть большая пауза (более 1 секунды)
  if (segment.start - prevSegment.end > 1.0) return true;
  
  // Если текст начинается с заглавной буквы (после точки)
  const text = segment.text.trim();
  if (text.length > 0 && text[0] === text[0].toUpperCase()) {
    // Проверяем, заканчивается ли предыдущий сегмент точкой
    const prevText = prevSegment.text.trim();
    if (prevText.endsWith('.') || prevText.endsWith('!') || prevText.endsWith('?')) {
      return true;
    }
  }
  
  return false;
}

/**
 * Добавляет переводы к структуре транскрипции
 * @param {Object} transcriptionData - Данные транскрипции
 * @param {Array} translations - Массив переводов
 * @returns {Object} - Обновленные данные транскрипции
 */
function addTranslations(transcriptionData, translations) {
  if (!translations || translations.length === 0) {
    return transcriptionData;
  }
  
  // Добавляем переводы к основному тексту
  transcriptionData.translation = translations.map((translation, index) => ({
    id: `trans-${index + 1}`,
    language: translation.language || 'en',
    text: translation.text
  }));
  
  // Добавляем переводы к предложениям (если есть)
  if (transcriptionData.sentences && translations.sentences) {
    transcriptionData.sentences.forEach((sentence, sentenceIndex) => {
      const sentenceTranslation = translations.sentences[sentenceIndex];
      if (sentenceTranslation) {
        sentence.translation = sentenceTranslation.map((translation, index) => ({
          id: `${sentence.id}-tr-${index + 1}`,
          language: translation.language || 'en',
          text: translation.text
        }));
        
        // Добавляем переводы к фразам (если есть)
        if (sentence.utterances && sentenceTranslation.utterances) {
          sentence.utterances.forEach((utterance, utteranceIndex) => {
            const utteranceTranslation = sentenceTranslation.utterances[utteranceIndex];
            if (utteranceTranslation) {
              utterance.translation = utteranceTranslation.map((translation, index) => ({
                id: `${utterance.id}-tr-${index + 1}`,
                language: translation.language || 'en',
                text: translation.text
              }));
            }
          });
        }
      }
    });
  }
  
  return transcriptionData;
}

function extractLanguage(gladiaResponse) {
  const result = gladiaResponse?.result;
  const t = result?.transcription;
  if (t?.languages && Array.isArray(t.languages) && t.languages.length > 0) {
    console.log('[DEBUG] Язык найден в transcription.languages:', t.languages[0]);
    return t.languages[0];
  }
  if (t?.language) {
    console.log('[DEBUG] Язык найден в transcription.language:', t.language);
    return t.language;
  }
  if (t?.utterances && t.utterances.length > 0 && t.utterances[0].language) {
    console.log('[DEBUG] Язык найден в utterances[0].language:', t.utterances[0].language);
    return t.utterances[0].language;
  }
  if (t?.sentences && t.sentences.length > 0 && t.sentences[0].language) {
    console.log('[DEBUG] Язык найден в sentences[0].language:', t.sentences[0].language);
    return t.sentences[0].language;
  }
  if (result?.language) {
    console.log('[DEBUG] Язык найден в result.language:', result.language);
    return result.language;
  }
  if (result?.detected_language) {
    console.log('[DEBUG] Язык найден в result.detected_language:', result.detected_language);
    return result.detected_language;
  }
  if (gladiaResponse?.language) {
    console.log('[DEBUG] Язык найден в gladiaResponse.language:', gladiaResponse.language);
    return gladiaResponse.language;
  }
  console.log('[DEBUG] Язык не найден, возвращаю unknown');
  return 'unknown';
}

module.exports = {
  processGladiaResponse,
  generateId,
  validateTranscription,
  processGladiaTranscription,
  groupSegmentsIntoSentences,
  isSegmentStart,
  addTranslations
}; 