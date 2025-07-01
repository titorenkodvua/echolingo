const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// Примеры использования API материалов с уровнем сложности
async function examples() {
  console.log('📚 Examples: Materials API with difficultyLevel\n');

  // 1. Создание материала с уровнем сложности A1 (начальный)
  console.log('1️⃣ Creating A1 level material...');
  const a1Material = await axios.post(`${BASE_URL}/materials`, {
    title: 'Приветствие на польском',
    description: 'Базовые фразы приветствия',
    audioFileName: 'greetings.mp3',
    transcriptionId: 'transcription-1.json',
    tags: ['польский', 'приветствие', 'базовый'],
    difficultyLevel: 'A1',
    isPublic: true
  });
  console.log('✅ A1 Material created:', a1Material.data.data.title);

  // 2. Создание материала с уровнем сложности B2 (продвинутый)
  console.log('\n2️⃣ Creating B2 level material...');
  const b2Material = await axios.post(`${BASE_URL}/materials`, {
    title: 'Деловая встреча на польском',
    description: 'Сложный диалог в деловой среде',
    audioFileName: 'business-meeting.mp3',
    transcriptionId: 'transcription-2.json',
    tags: ['польский', 'бизнес', 'деловая речь'],
    difficultyLevel: 'B2',
    isPublic: true
  });
  console.log('✅ B2 Material created:', b2Material.data.data.title);

  // 3. Создание материала с уровнем сложности C1 (высокий)
  console.log('\n3️⃣ Creating C1 level material...');
  const c1Material = await axios.post(`${BASE_URL}/materials`, {
    title: 'Академическая лекция на польском',
    description: 'Лекция по истории Польши',
    audioFileName: 'academic-lecture.mp3',
    transcriptionId: 'transcription-3.json',
    tags: ['польский', 'академический', 'история'],
    difficultyLevel: 'C1',
    isPublic: true
  });
  console.log('✅ C1 Material created:', c1Material.data.data.title);

  // 4. Обновление уровня сложности
  console.log('\n4️⃣ Updating difficulty level...');
  await axios.put(`${BASE_URL}/materials/${a1Material.data.data.id}`, {
    difficultyLevel: 'A2'
  });
  console.log('✅ Difficulty level updated from A1 to A2');

  // 5. Получение списка материалов
  console.log('\n5️⃣ Getting all materials...');
  const materials = await axios.get(`${BASE_URL}/materials`);
  
  console.log('📋 All materials:');
  materials.data.data.materials.forEach(material => {
    console.log(`  - ${material.title} (${material.difficultyLevel})`);
  });

  console.log('\n🎉 Examples completed!');
}

// Запускаем примеры
examples().catch(console.error); 