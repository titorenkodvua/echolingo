const { processGladiaResponse } = require('./utils/transcriptionProcessor');
const fs = require('fs');
const path = require('path');

// Пример сырых данных от Gladia API V2 (современный формат)
const rawGladiaV2Response = {
  "id": "94f938a7-be47-4fc0-a6c7-94c54c417baa",
  "created_at": "2025-06-28T15:10:00Z",
  "completed_at": "2025-06-28T15:10:05Z",
  "result": {
    "transcription": {
      "confidence": 0.98,
      "languages": ["en"],
      "full_transcript": "Hello, this is a test audio file for transcription. I'm speaking in English to demonstrate the transcription process.",
      "sentences": [
        {
          "sentence": "Hello, this is a test audio file for transcription.",
          "start": 0.0,
          "end": 3.5,
          "confidence": 0.99,
          "speaker": 0
        },
        {
          "sentence": "I'm speaking in English to demonstrate the transcription process.",
          "start": 3.6,
          "end": 7.2,
          "confidence": 0.97,
          "speaker": 0
        }
      ],
      "utterances": [
        {
          "text": "Hello, this is a test audio file for transcription.",
          "start": 0.0,
          "end": 3.5,
          "confidence": 0.99,
          "speaker": 0
        },
        {
          "text": "I'm speaking in English to demonstrate the transcription process.",
          "start": 3.6,
          "end": 7.2,
          "confidence": 0.97,
          "speaker": 0
        }
      ]
    },
    "translation": {
      "results": [
        {
          "languages": ["ru"],
          "full_transcript": "Привет, это тестовый аудиофайл для транскрипции. Я говорю по-английски, чтобы продемонстрировать процесс транскрипции.",
          "sentences": [
            {
              "sentence": "Привет, это тестовый аудиофайл для транскрипции."
            },
            {
              "sentence": "Я говорю по-английски, чтобы продемонстрировать процесс транскрипции."
            }
          ],
          "utterances": [
            {
              "text": "Привет, это тестовый аудиофайл для транскрипции."
            },
            {
              "text": "Я говорю по-английски, чтобы продемонстрировать процесс транскрипции."
            }
          ]
        }
      ]
    },
    "metadata": {
      "audio_duration": 7.2,
      "transcription_time": 5.0
    },
    "summarization": {
      "results": "This is a test audio file demonstrating transcription capabilities."
    }
  }
};

async function testDataTransformation() {
  console.log('🔄 ТЕСТИРОВАНИЕ ПРЕОБРАЗОВАНИЯ ДАННЫХ\n');
  console.log('=' .repeat(60));
  
  // Тест: Современный формат Gladia V2
  console.log('\n📋 ТЕСТ: Современный формат Gladia API V2');
  console.log('-'.repeat(40));
  
  console.log('\n📥 Сырые данные от Gladia API V2:');
  console.log(JSON.stringify(rawGladiaV2Response, null, 2));
  
  console.log('\n🔄 Преобразование через processGladiaResponse...');
  const processedV2 = processGladiaResponse(rawGladiaV2Response);
  
  console.log('\n📤 Результат преобразования:');
  console.log(JSON.stringify(processedV2, null, 2));
  
  // Сохраняем результат в файл
  const v2OutputPath = path.join(__dirname, 'test-output-v2.json');
  fs.writeFileSync(v2OutputPath, JSON.stringify(processedV2, null, 2));
  console.log(`\n💾 Результат сохранен в: ${v2OutputPath}`);
  
  // Проверка структуры
  console.log('\n\n📊 ПРОВЕРКА СТРУКТУРЫ');
  console.log('-'.repeat(40));
  
  console.log('\n✅ Результат должен содержать следующие поля:');
  console.log('   - language');
  console.log('   - full_transcript');
  console.log('   - count_of_speakers');
  console.log('   - translation (массив)');
  console.log('   - sentences (массив с utterances и translations)');
  
  console.log('\n🔍 Проверка структуры результата:');
  console.log(`   - language: ${processedV2.language}`);
  console.log(`   - full_transcript: ${processedV2.full_transcript ? '✅' : '❌'}`);
  console.log(`   - count_of_speakers: ${processedV2.count_of_speakers}`);
  console.log(`   - translation: ${Array.isArray(processedV2.translation) ? '✅' : '❌'}`);
  console.log(`   - sentences: ${Array.isArray(processedV2.sentences) ? '✅' : '❌'}`);
  console.log(`   - sentences count: ${processedV2.sentences.length}`);
  
  console.log('\n\n🎉 ТЕСТИРОВАНИЕ ЗАВЕРШЕНО!');
  console.log('📁 Результат сохранен в файл:');
  console.log(`   - ${v2OutputPath}`);
}

// Запускаем тест
testDataTransformation().catch(console.error); 