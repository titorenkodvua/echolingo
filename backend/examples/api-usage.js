const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3001';
const TEST_USER_ID = 'test-user-123';

// Создаем тестовый аудиофайл (заглушка)
function createTestAudioFile() {
  const testDir = path.join(__dirname, '..', 'uploads', 'temp');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  const testFilePath = path.join(testDir, 'test-audio.txt');
  fs.writeFileSync(testFilePath, 'This is a test audio file content');
  return testFilePath;
}

async function demonstrateAPI() {
  console.log('🚀 Echolingo API Demonstration\n');

  try {
    // 1. Создание материала
    console.log('1. Creating a test material...');
    const materialData = {
      title: 'Test English Lesson',
      description: 'A sample lesson for testing the API',
      audioFileName: 'test-audio.mp3',
      transcriptionId: 'test-transcription-123',
      userId: TEST_USER_ID,
      tags: ['english', 'beginner', 'test'],
      isPublic: true
    };

    const materialResponse = await axios.post(`${BASE_URL}/api/materials`, materialData);
    const materialId = materialResponse.data.data.id;
    console.log('✅ Material created:', materialId);

    // 2. Получение списка материалов
    console.log('\n2. Getting user materials...');
    const materialsResponse = await axios.get(`${BASE_URL}/api/materials?userId=${TEST_USER_ID}`);
    console.log('✅ Materials found:', materialsResponse.data.data.total);

    // 3. Создание плейлиста
    console.log('\n3. Creating a playlist...');
    const playlistData = {
      title: 'My Learning Playlist',
      description: 'A collection of materials for daily practice',
      userId: TEST_USER_ID,
      isPublic: false,
      materialIds: [materialId]
    };

    const playlistResponse = await axios.post(`${BASE_URL}/api/playlists`, playlistData);
    const playlistId = playlistResponse.data.data.id;
    console.log('✅ Playlist created:', playlistId);

    // 4. Получение списка плейлистов
    console.log('\n4. Getting user playlists...');
    const playlistsResponse = await axios.get(`${BASE_URL}/api/playlists?userId=${TEST_USER_ID}`);
    console.log('✅ Playlists found:', playlistsResponse.data.data.total);

    // 5. Отметка о прослушивании материала
    console.log('\n5. Marking material as played...');
    await axios.post(`${BASE_URL}/api/materials/${materialId}/play?userId=${TEST_USER_ID}`);
    console.log('✅ Material marked as played');

    // 6. Поиск материалов
    console.log('\n6. Searching materials...');
    const searchResponse = await axios.get(`${BASE_URL}/api/materials/search?q=english&userId=${TEST_USER_ID}`);
    console.log('✅ Search results:', searchResponse.data.data.total);

    // 7. Получение публичных материалов
    console.log('\n7. Getting public materials...');
    const publicMaterialsResponse = await axios.get(`${BASE_URL}/api/materials/public`);
    console.log('✅ Public materials found:', publicMaterialsResponse.data.data.total);

    // 8. Обновление материала
    console.log('\n8. Updating material...');
    const updateData = {
      title: 'Updated English Lesson',
      description: 'Updated description for the lesson'
    };
    await axios.put(`${BASE_URL}/api/materials/${materialId}?userId=${TEST_USER_ID}`, updateData);
    console.log('✅ Material updated');

    // 9. Получение конкретного материала
    console.log('\n9. Getting specific material...');
    const specificMaterialResponse = await axios.get(`${BASE_URL}/api/materials/${materialId}?userId=${TEST_USER_ID}`);
    console.log('✅ Material retrieved:', specificMaterialResponse.data.data.title);

    // 10. Получение конкретного плейлиста
    console.log('\n10. Getting specific playlist...');
    const specificPlaylistResponse = await axios.get(`${BASE_URL}/api/playlists/${playlistId}?userId=${TEST_USER_ID}`);
    console.log('✅ Playlist retrieved:', specificPlaylistResponse.data.data.title);

    console.log('\n🎉 All API demonstrations completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Materials created: 1`);
    console.log(`   - Playlists created: 1`);
    console.log(`   - API endpoints tested: 10`);

  } catch (error) {
    console.error('❌ API demonstration failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Запуск демонстрации
demonstrateAPI(); 