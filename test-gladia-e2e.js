const fs = require('fs');
const path = require('path');
const axios = require('axios');

// === КОНФИГ ===
const SERVER_URL = 'http://localhost:3001';
const AUDIO_FILE_NAME = '1751055302925-41c4a468.mp3';
const USER_ID = 'string';
const AUDIO_FILE_PATH = path.join('backend', 'uploads', USER_ID, AUDIO_FILE_NAME);
const OUTPUT_FILE = `gladia-e2e-result-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

const transcriptionOptions = {
  language: 'auto',
  translation: true,
  targetLanguages: ['ru', 'en'],
  diarization: { enable: true, enhanced: false },
  summarization: { enable: true, type: 'concise' },
  sentences: true,
  detect_language: true
};

async function main() {
  try {
    // 1. Проверяем, что файл существует
    if (!fs.existsSync(AUDIO_FILE_PATH)) {
      throw new Error(`Audio file not found: ${AUDIO_FILE_PATH}`);
    }
    console.log('✅ Audio file found:', AUDIO_FILE_PATH);

    // 2. Запускаем транскрипцию
    console.log('🚀 Запуск транскрипции через /api/transcription/start ...');
    const startResp = await axios.post(`${SERVER_URL}/api/transcription/start`, {
      fileName: AUDIO_FILE_NAME,
      userId: USER_ID,
      options: transcriptionOptions
    });
    if (!startResp.data.success) throw new Error('Transcription start failed');
    const { id: transcriptionId, predictionId } = startResp.data.data;
    console.log('🆔 transcriptionId:', transcriptionId);
    console.log('🔮 predictionId:', predictionId);

    // 3. Ждем завершения транскрипции
    console.log('⏳ Ожидание завершения транскрипции через /api/transcription/wait ...');
    const waitResp = await axios.get(`${SERVER_URL}/api/transcription/wait/${predictionId}?timeout=300`);
    if (!waitResp.data.success) throw new Error('Transcription wait failed');
    console.log('✅ Транскрипция завершена!');

    // 4. Получаем итоговую структуру
    console.log('📥 Получение итоговой структуры через /api/transcription/{id} ...');
    const finalResp = await axios.get(`${SERVER_URL}/api/transcription/${transcriptionId}`);
    if (!finalResp.data.success) throw new Error('Get transcription failed');
    const result = finalResp.data.data;

    // 5. Сохраняем результат в файл
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2), 'utf-8');
    console.log(`💾 Итоговая структура сохранена в файл: ${OUTPUT_FILE}`);
    console.log('🎉 E2E тест успешно завершён!');
  } catch (err) {
    console.error('❌ E2E Test failed:', err.message);
    if (err.response) {
      console.error('Response data:', err.response.data);
    }
    fs.writeFileSync(
      `gladia-e2e-error-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
      JSON.stringify({ error: err.message, response: err.response?.data }, null, 2),
      'utf-8'
    );
  }
}

main(); 