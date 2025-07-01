const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'database/echolingo.sqlite');
const outputPath = path.join(__dirname, 'database-export.json');

// Функция для выполнения SQL запроса
function queryDatabase(sql) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    db.all(sql, [], (err, rows) => {
      db.close();
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

async function exportDatabase() {
  try {
    console.log('📊 Exporting database to JSON...\n');
    
    // Получаем данные из всех таблиц
    const transcriptions = await queryDatabase('SELECT * FROM transcriptions');
    const materials = await queryDatabase('SELECT * FROM materials');
    const playlists = await queryDatabase('SELECT * FROM playlists');
    const playlistMaterials = await queryDatabase('SELECT * FROM playlist_materials');
    
    // Получаем статистику
    const stats = {
      transcriptions: transcriptions.length,
      materials: materials.length,
      playlists: playlists.length,
      playlistMaterials: playlistMaterials.length,
      exportDate: new Date().toISOString()
    };
    
    // Создаем объект с данными
    const exportData = {
      stats,
      transcriptions,
      materials,
      playlists,
      playlistMaterials
    };
    
    // Сохраняем в JSON файл
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
    
    console.log('✅ Database exported successfully!');
    console.log(`📁 File: ${outputPath}`);
    console.log('\n📈 Statistics:');
    console.log(`   Transcriptions: ${stats.transcriptions}`);
    console.log(`   Materials: ${stats.materials}`);
    console.log(`   Playlists: ${stats.playlists}`);
    console.log(`   Playlist Materials: ${stats.playlistMaterials}`);
    
    // Показываем примеры данных
    if (transcriptions.length > 0) {
      console.log('\n📝 Sample transcription:');
      console.log(JSON.stringify(transcriptions[0], null, 2));
    }
    
    if (materials.length > 0) {
      console.log('\n📚 Sample material:');
      console.log(JSON.stringify(materials[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error exporting database:', error);
  }
}

// Запускаем экспорт
exportDatabase(); 