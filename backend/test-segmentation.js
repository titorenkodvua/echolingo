const fs = require('fs');
const path = require('path');
const segmentationService = require('./services/segmentationService');
const { printSegments } = require('./utils/segmentPrinter');
const sqlite3 = require('sqlite3').verbose();

const TEST_INPUT = path.join(__dirname, 'clean-processed-data-2025-06-28T23-08-39-327Z.json');
const RAW = fs.readFileSync(TEST_INPUT, 'utf-8');
const BASE_TRANSCRIPTION = JSON.parse(RAW);

const { spawnSync } = require('child_process');

const TEST_CASES = [
  {
    name: 'sentences-strict',
    params: { minWords: 5, maxWords: 15, allowDifferentSpeakers: false, allowCutInsideSentence: false, avoidSmallSegments: true },
  },
  {
    name: 'utterances-strict',
    params: { minWords: 5, maxWords: 15, allowDifferentSpeakers: false, allowCutInsideSentence: true, avoidSmallSegments: true },
  },
  {
    name: 'utterances-mixed-speakers',
    params: { minWords: 3, maxWords: 7, allowDifferentSpeakers: true, allowCutInsideSentence: true, avoidSmallSegments: true },
  },
  {
    name: 'utterances-no-avoid',
    params: { minWords: 3, maxWords: 7, allowDifferentSpeakers: false, allowCutInsideSentence: true, avoidSmallSegments: false },
  },
  {
    name: 'sentences-no-avoid',
    params: { minWords: 3, maxWords: 7, allowDifferentSpeakers: false, allowCutInsideSentence: false, avoidSmallSegments: false },
  },
  {
    name: 'utterances-tiny',
    params: { minWords: 1, maxWords: 3, allowDifferentSpeakers: false, allowCutInsideSentence: true, avoidSmallSegments: true },
  },
];

function runPrintSegments(params, outFile, logFile) {
  const args = [
    'backend/segment-transcription.js',
    '--input', TEST_INPUT,
    '--output', outFile,
    '--minWords', params.minWords,
    '--maxWords', params.maxWords,
    '--allowDifferentSpeakers', params.allowDifferentSpeakers,
    '--allowCutInsideSentence', params.allowCutInsideSentence,
    '--avoidSmallSegments', params.avoidSmallSegments
  ];
  // Сегментируем и сохраняем результат (JSON)
  spawnSync('node', args, { encoding: 'utf-8' });
  // Читаем JSON, печатаем подробный лог в logFile
  const result = JSON.parse(fs.readFileSync(outFile, 'utf-8'));
  printSegments(result, params, logFile);
}

function parsePrintSegmentsOutput(output) {
  const segments = [];
  let current = { utterances: [], words: 0, speaker: null };
  const lines = output.split(/\r?\n/);
  for (const line of lines) {
    if (line.startsWith('--- SEGMENT')) {
      if (current.utterances.length > 0) segments.push(current);
      current = { utterances: [], words: 0, speaker: null };
    } else if (line.startsWith('[')) {
      // [speaker] (N) text
      const match = line.match(/^\[(\d+)\] \((\d+)\) /);
      if (match) {
        const speaker = Number(match[1]);
        const words = Number(match[2]);
        if (current.speaker === null) current.speaker = speaker;
        current.utterances.push({ speaker, words });
        current.words += words;
      }
    } else if (line.startsWith('(words in segment:')) {
      // можно проверить total
    }
  }
  if (current.utterances.length > 0) segments.push(current);
  return segments;
}

function checkSegmentsParsed(segments, { minWords, maxWords, allowDifferentSpeakers, avoidSmallSegments }) {
  let ok = true;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    // Проверка на длину
    if (seg.words < minWords && avoidSmallSegments) {
      console.error(`FAIL: Segment ${i+1} too short (${seg.words} < ${minWords})`);
      ok = false;
    }
    if (seg.words > maxWords && !(avoidSmallSegments && seg.words < minWords)) {
      // Превышение maxWords допустимо только если объединяли короткие сегменты
      console.error(`WARN: Segment ${i+1} too long (${seg.words} > ${maxWords})`);
    }
    // Проверка на спикеров
    if (!allowDifferentSpeakers) {
      const speakers = new Set(seg.utterances.map(u => u.speaker));
      if (speakers.size > 1) {
        console.error(`FAIL: Segment ${i+1} has mixed speakers: ${[...speakers].join(',')}`);
        ok = false;
      }
    }
    // Проверка на длину каждой utterance (не должна быть > maxWords)
    for (let j = 0; j < seg.utterances.length; j++) {
      const u = seg.utterances[j];
      if (u.words > maxWords) {
        console.error(`WARN: Utterance ${j+1} in segment ${i+1} too long (${u.words} > ${maxWords})`);
      }
    }
  }
  return ok;
}

function runTestCase(testCase) {
  const { name, params } = testCase;
  const outFile = path.join(__dirname, `segmented-result-${name}.json`);
  const logFile = path.join(__dirname, `segmented-result-${name}.log`);
  runPrintSegments(params, outFile, logFile);
  console.log(`\n==== PRINTSEGMENTS OUTPUT for ${name} ====
(see ${logFile} for details)`);
  const logOutput = fs.readFileSync(logFile, 'utf-8');
  const segments = parsePrintSegmentsOutput(logOutput);
  const ok = checkSegmentsParsed(segments, params);
  console.log(`Test: ${name} | segments: ${segments.length} | result: ${ok ? 'OK' : 'FAIL'}`);
}

for (const testCase of TEST_CASES) {
  runTestCase(testCase);
}

// === EXTRA: Тестирование всех транскрипций из БД ===
const dbPath = path.join(__dirname, 'database', 'echolingo.sqlite');
const db = new sqlite3.Database(dbPath);

function runDbTranscriptionTests() {
  db.all('SELECT id, originalFileName, sentences FROM transcriptions WHERE sentences IS NOT NULL AND LENGTH(sentences) > 10', [], (err, rows) => {
    if (err) {
      console.error('DB error:', err);
      return;
    }
    rows.forEach(row => {
      let sentences;
      try {
        sentences = JSON.parse(row.sentences);
      } catch (e) {
        console.error(`Failed to parse sentences for ${row.originalFileName}`);
        return;
      }
      // Собираем объект транскрипции (минимально)
      const transcription = {
        language: 'unknown',
        full_transcript: '',
        count_of_speakers: null,
        translation: [],
        sentences
      };
      TEST_CASES.forEach(testCase => {
        const { name, params } = testCase;
        const safeName = row.originalFileName.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 40);
        const outFile = path.join(__dirname, `segmented-db-${safeName}-${name}.json`);
        const logFile = path.join(__dirname, `segmented-db-${safeName}-${name}.log`);
        // Сегментируем
        const result = segmentationService.segmentTranscription(JSON.parse(JSON.stringify(transcription)), params);
        fs.writeFileSync(outFile, JSON.stringify(result, null, 2), 'utf-8');
        printSegments(result, params, logFile);
        // Анализируем лог
        const logOutput = fs.readFileSync(logFile, 'utf-8');
        const segments = parsePrintSegmentsOutput(logOutput);
        const ok = checkSegmentsParsed(segments, params);
        console.log(`[DB] ${row.originalFileName} | ${name} | segments: ${segments.length} | result: ${ok ? 'OK' : 'FAIL'}`);
      });
    });
    db.close();
  });
}

if (process.env.TEST_DB === '1') {
  runDbTranscriptionTests();
} 