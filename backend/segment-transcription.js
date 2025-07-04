#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const segmentationService = require('./services/segmentationService');
const { printSegments } = require('./utils/segmentPrinter');

/**
 * Нарезка транскрипции на сегменты по правилам
 * @param {Object} transcription - исходный объект транскрипции
 * @param {Object} options - параметры нарезки
 * @param {number} options.minWords - минимальная длина сегмента в словах
 * @param {number} options.maxWords - максимальная длина сегмента в словах
 * @param {boolean} options.allowDifferentSpeakers - можно ли объединять utterances разных спикеров
 * @param {boolean} options.allowCutInsideSentence - можно ли делать разрезы внутри предложения
 * @param {boolean} options.avoidSmallSegments - избегать маленьких сегментов
 * @returns {Object} - изменённый объект транскрипции
 */
function segmentTranscription(transcription, {
  minWords = 5,
  maxWords = 15,
  allowDifferentSpeakers = false,
  allowCutInsideSentence = false,
  avoidSmallSegments = true
} = {}) {
  if (!transcription.sentences) return transcription;

  // Сбросим все is_segment_start
  for (const sentence of transcription.sentences) {
    for (const utt of sentence.utterances) {
      utt.is_segment_start = false;
    }
  }

  if (!allowCutInsideSentence) {
    // Нарезка только по границам предложений
    let segments = [];
    let currentSegment = [];
    let currentSpeaker = null;
    let segmentWordCount = 0;
    for (let i = 0; i < transcription.sentences.length; i++) {
      const sentence = transcription.sentences[i];
      const allUtterancesSameSpeaker = sentence.utterances.every(u => u.speaker === sentence.speaker);
      if (!allowDifferentSpeakers && !allUtterancesSameSpeaker) {
        // Смена спикера внутри предложения невозможна, сегмент завершается
        if (currentSegment.length > 0) {
          segments.push({ indices: currentSegment.slice(), speaker: currentSpeaker, words: segmentWordCount });
        }
        currentSegment = [i];
        currentSpeaker = sentence.speaker;
        segmentWordCount = sentence.utterances.reduce((sum, utt) => sum + utt.text.trim().split(/\s+/).filter(Boolean).length, 0);
        continue;
      }
      // Если сегмент пустой — начинаем новый
      if (currentSegment.length === 0) {
        currentSegment.push(i);
        currentSpeaker = sentence.speaker;
        segmentWordCount = sentence.utterances.reduce((sum, utt) => sum + utt.text.trim().split(/\s+/).filter(Boolean).length, 0);
        continue;
      }
      // Проверка на смену спикера
      if (!allowDifferentSpeakers && sentence.speaker !== currentSpeaker) {
        // Завершаем сегмент
        segments.push({ indices: currentSegment.slice(), speaker: currentSpeaker, words: segmentWordCount });
        currentSegment = [i];
        currentSpeaker = sentence.speaker;
        segmentWordCount = sentence.utterances.reduce((sum, utt) => sum + utt.text.trim().split(/\s+/).filter(Boolean).length, 0);
        continue;
      }
      // Добавляем предложение к текущему сегменту
      currentSegment.push(i);
      segmentWordCount += sentence.utterances.reduce((sum, utt) => sum + utt.text.trim().split(/\s+/).filter(Boolean).length, 0);
      // Если достигли minWords и не превышаем maxWords — продолжаем
      if (segmentWordCount >= minWords && segmentWordCount <= maxWords) {
        continue;
      }
      // Если превышаем maxWords, но ещё не достигли minWords — продолжаем накапливать
      if (segmentWordCount < minWords) {
        continue;
      }
      // Если превышаем maxWords и достигли minWords — завершаем сегмент
      if (segmentWordCount > maxWords && segmentWordCount >= minWords) {
        segments.push({ indices: currentSegment.slice(), speaker: currentSpeaker, words: segmentWordCount });
        currentSegment = [];
        currentSpeaker = null;
        segmentWordCount = 0;
      }
    }
    // Добавляем последний сегмент
    if (currentSegment.length > 0) {
      segments.push({ indices: currentSegment.slice(), speaker: currentSpeaker, words: segmentWordCount });
    }
    // avoidSmallSegments: объединяем короткие сегменты с предыдущим того же спикера
    if (avoidSmallSegments && segments.length > 1) {
      let mergedSegments = [];
      let prev = segments[0];
      for (let i = 1; i < segments.length; i++) {
        const curr = segments[i];
        if (curr.words < minWords && (!allowDifferentSpeakers && curr.speaker === prev.speaker)) {
          // Объединяем
          prev.indices = prev.indices.concat(curr.indices);
          prev.words += curr.words;
        } else {
          mergedSegments.push(prev);
          prev = curr;
        }
      }
      mergedSegments.push(prev);
      segments = mergedSegments;
    }
    // Сбросим все is_segment_start
    for (const sentence of transcription.sentences) {
      for (const utt of sentence.utterances) {
        utt.is_segment_start = false;
      }
    }
    // Проставляем is_segment_start только у первого utterance каждого сегмента
    for (const seg of segments) {
      const firstSentenceIdx = seg.indices[0];
      transcription.sentences[firstSentenceIdx].utterances[0].is_segment_start = true;
    }
    return transcription;
  } else {
    // Новый алгоритм: можно резать где угодно, но избегаем маленьких сегментов
    const flatUtterances = [];
    transcription.sentences.forEach((sentence, sentenceIdx) => {
      sentence.utterances.forEach((utt, uttIdx) => {
        flatUtterances.push({
          ...utt,
          _sentenceIdx: sentenceIdx,
          _uttIdx: uttIdx,
          _speaker: utt.speaker,
          _text: utt.text,
        });
      });
    });
    let segments = [];
    let currentSegment = [];
    let currentSpeaker = null;
    let segmentWordCount = 0;
    for (let i = 0; i < flatUtterances.length; i++) {
      const utt = flatUtterances[i];
      const wordCount = utt._text.trim().split(/\s+/).filter(Boolean).length;
      if (!allowDifferentSpeakers && utt._speaker !== currentSpeaker && currentSegment.length > 0) {
        // Завершаем сегмент
        segments.push({ indices: currentSegment.slice(), speaker: currentSpeaker, words: segmentWordCount });
        currentSegment = [];
        segmentWordCount = 0;
      }
      if (currentSegment.length === 0) {
        currentSegment.push(i);
        currentSpeaker = utt._speaker;
        segmentWordCount = wordCount;
        continue;
      }
      // Добавляем utterance к текущему сегменту
      currentSegment.push(i);
      segmentWordCount += wordCount;
      // Если достигли minWords и не превышаем maxWords — продолжаем
      if (segmentWordCount >= minWords && segmentWordCount <= maxWords) {
        continue;
      }
      // Если превышаем maxWords и достигли minWords — завершаем сегмент и начинаем новый
      if (segmentWordCount > maxWords && segmentWordCount - wordCount >= minWords) {
        // Завершаем сегмент без текущего utterance
        segments.push({ indices: currentSegment.slice(0, -1), speaker: currentSpeaker, words: segmentWordCount - wordCount });
        // Начинаем новый сегмент с текущего utterance
        currentSegment = [i];
        segmentWordCount = wordCount;
      }
      // Если превышаем maxWords, но ещё не достигли minWords — продолжаем накапливать
      // (этот случай не требует отдельной обработки)
    }
    // Добавляем последний сегмент
    if (currentSegment.length > 0) {
      segments.push({ indices: currentSegment.slice(), speaker: currentSpeaker, words: segmentWordCount });
    }
    // avoidSmallSegments: объединяем короткие сегменты с предыдущим того же спикера
    if (avoidSmallSegments && segments.length > 1) {
      let mergedSegments = [];
      let prev = segments[0];
      for (let i = 1; i < segments.length; i++) {
        const curr = segments[i];
        if (curr.words < minWords && (!allowDifferentSpeakers && curr.speaker === prev.speaker)) {
          // Объединяем
          prev.indices = prev.indices.concat(curr.indices);
          prev.words += curr.words;
        } else {
          mergedSegments.push(prev);
          prev = curr;
        }
      }
      mergedSegments.push(prev);
      segments = mergedSegments;
    }
    // Сбросим все is_segment_start
    for (const sentence of transcription.sentences) {
      for (const utt of sentence.utterances) {
        utt.is_segment_start = false;
      }
    }
    // Проставляем is_segment_start только у первого utterance каждого сегмента
    for (const seg of segments) {
      const firstUtt = flatUtterances[seg.indices[0]];
      transcription.sentences[firstUtt._sentenceIdx].utterances[firstUtt._uttIdx].is_segment_start = true;
    }
    return transcription;
  }
}

// CLI
if (require.main === module) {
  const argv = require('yargs/yargs')(process.argv.slice(2))
    .usage('Usage: $0 --input <input.json> --output <output.json> [options]')
    .option('input', { alias: 'i', describe: 'Input JSON file', demandOption: true, type: 'string' })
    .option('output', { alias: 'o', describe: 'Output JSON file', demandOption: true, type: 'string' })
    .option('minWords', { describe: 'Minimum words per segment', type: 'number', default: 5 })
    .option('maxWords', { describe: 'Maximum words per segment', type: 'number', default: 15 })
    .option('allowDifferentSpeakers', { describe: 'Allow segments with different speakers', type: 'boolean', default: false })
    .option('allowCutInsideSentence', { describe: 'Allow cuts inside sentence', type: 'boolean', default: false })
    .option('avoidSmallSegments', { describe: 'Avoid small segments', type: 'boolean', default: true })
    .option('logFile', { describe: 'Output log file', type: 'string' })
    .help()
    .argv;

  const inputPath = path.resolve(argv.input);
  const outputPath = path.resolve(argv.output);
  const params = {
    minWords: argv.minWords,
    maxWords: argv.maxWords,
    allowDifferentSpeakers: argv.allowDifferentSpeakers,
    allowCutInsideSentence: argv.allowCutInsideSentence,
    avoidSmallSegments: argv.avoidSmallSegments
  };

  const raw = fs.readFileSync(inputPath, 'utf-8');
  const transcription = JSON.parse(raw);
  const result = segmentationService.segmentTranscription(transcription, params);
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`Segmented transcription saved to ${outputPath}`);
  // For CLI: if logFile is not specified, print to console
  if (!argv.logFile) {
    printSegments(result, params);
  } else {
    printSegments(result, params, argv.logFile);
  }
}

module.exports = { segmentTranscription: segmentationService.segmentTranscription.bind(segmentationService) }; 