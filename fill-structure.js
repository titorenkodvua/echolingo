const fs = require('fs');
const path = require('path');

function pad(num) { return num.toString().padStart(2, '0'); }

function makeId(prefix, ...parts) {
  return [prefix, ...parts].join('-');
}

function fillStructure(inputJson) {
  // Универсальный доступ к transcription
  const transcription = inputJson?.result?.transcription || inputJson?.transcription;
  if (!transcription) throw new Error('Не найден transcription в JSON');

  // Язык оригинала (берём первый из languages или language)
  const language = transcription.language || (Array.isArray(transcription.languages) ? transcription.languages[0] : undefined) || 'unknown';
  const full_transcript = transcription.full_transcript || '';
  const count_of_speakers = transcription.count_of_speakers || transcription.speakers || null;

  // Переводы всего текста
  const translationResults = inputJson?.result?.translation?.results || inputJson?.translation?.results || [];
  const translation = translationResults.map((tr, i) => ({
    id: makeId('trans', i + 1),
    language: tr.languages ? tr.languages[0] : tr.language || 'unknown',
    text: tr.full_transcript || '',
  }));

  // Sentences
  const sentences = (transcription.sentences || []).map((sent, i) => {
    const sentId = makeId('sent', i + 1);
    // Переводы предложения - ищем во всех языках
    let sentTranslations = [];
    translationResults.forEach((tr, langIndex) => {
      if (tr.sentences) {
        const matchingSent = tr.sentences.find(ts => 
          Math.abs(ts.start - sent.start) < 0.1 && Math.abs(ts.end - sent.end) < 0.1
        );
        if (matchingSent) {
          sentTranslations.push({
            id: makeId(sentId + '-tr', langIndex + 1),
            language: tr.languages ? tr.languages[0] : tr.language || 'unknown',
            text: matchingSent.sentence || matchingSent.text || '',
          });
        }
      }
    });

    // Utterances внутри предложения
    const utterances = (transcription.utterances || [])
      .filter(u => u.start >= sent.start && u.end <= sent.end)
      .map((utt, j) => {
        const uttId = makeId('utt', i + 1, j + 1);
        // Переводы utterance - ищем во всех языках
        let uttTranslations = [];
        translationResults.forEach((tr, langIndex) => {
          if (tr.utterances) {
            const matchingUtt = tr.utterances.find(tu => 
              Math.abs(tu.start - utt.start) < 0.1 && Math.abs(tu.end - utt.end) < 0.1
            );
            if (matchingUtt) {
              uttTranslations.push({
                id: makeId(uttId + '-tr', langIndex + 1),
                language: tr.languages ? tr.languages[0] : tr.language || 'unknown',
                text: matchingUtt.text || '',
              });
            }
          }
        });
        return {
          id: uttId,
          is_segment_start: utt.is_segment_start || false,
          speaker: utt.speaker,
          text: utt.text,
          start: utt.start,
          end: utt.end,
          confidence: utt.confidence,
          translation: uttTranslations,
        };
      });
    return {
      id: sentId,
      sentence: sent.sentence,
      speaker: sent.speaker,
      start: sent.start,
      end: sent.end,
      translation: sentTranslations,
      utterances,
    };
  });

  return {
    language,
    full_transcript,
    count_of_speakers,
    translation,
    sentences,
  };
}

// CLI: node fill-structure.js respond.json [output.json]
const inputFile = process.argv[2];
const outputFile = process.argv[3];
if (!inputFile) {
  console.error('Укажите путь к JSON-файлу: node fill-structure.js respond.json [output.json]');
  process.exit(1);
}
const absPath = path.resolve(inputFile);
fs.readFile(absPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Ошибка чтения файла:', err.message);
    process.exit(1);
  }
  try {
    const json = JSON.parse(data);
    const result = fillStructure(json);
    if (outputFile) {
      fs.writeFileSync(outputFile, JSON.stringify(result, null, 2), 'utf8');
      console.log('Структура сохранена в', outputFile);
    } else {
      console.dir(result, { depth: null, colors: true });
    }
  } catch (e) {
    console.error('Ошибка парсинга или обработки JSON:', e.message);
    process.exit(1);
  }
}); 