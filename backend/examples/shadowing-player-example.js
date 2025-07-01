// Пример использования поля recommendedRepetitions в плеере shadowing

class ShadowingPlayer {
  constructor(material) {
    this.material = material;
    this.currentRepetition = 0;
    this.recommendedRepetitions = material.recommendedRepetitions || 3;
    this.isPlaying = false;
    this.currentSegment = 0;
  }

  // Начать воспроизведение
  start() {
    console.log(`🎵 Начинаем изучение: ${this.material.title}`);
    console.log(`📊 Рекомендуемые повторения: ${this.recommendedRepetitions}`);
    console.log(`⏱️ Длительность: ${this.material.duration} сек`);
    console.log(`🎯 Время изучения: ${this.material.estimatedTime} мин`);
    console.log(`⭐ Рейтинг: ${this.material.averageRating}/5 (${this.material.ratingCount} оценок)`);
    
    this.isPlaying = true;
    this.playNextRepetition();
  }

  // Воспроизвести следующее повторение
  playNextRepetition() {
    if (this.currentRepetition >= this.recommendedRepetitions) {
      this.complete();
      return;
    }

    this.currentRepetition++;
    console.log(`\n🔄 Повторение ${this.currentRepetition}/${this.recommendedRepetitions}`);
    
    // Симуляция воспроизведения сегмента
    this.playSegment();
  }

  // Воспроизвести сегмент
  playSegment() {
    console.log(`🎤 Сегмент ${this.currentSegment + 1}: "Привет, как дела?"`);
    console.log(`🔊 Воспроизведение аудио...`);
    
    // Симуляция паузы для shadowing
    setTimeout(() => {
      console.log(`👤 Ваша очередь повторить!`);
      
      // Симуляция паузы для повторения пользователем
      setTimeout(() => {
        this.nextSegment();
      }, 2000);
    }, 3000);
  }

  // Следующий сегмент
  nextSegment() {
    this.currentSegment++;
    
    if (this.currentSegment >= 3) { // Предполагаем 3 сегмента
      this.currentSegment = 0;
      this.playNextRepetition();
    } else {
      this.playSegment();
    }
  }

  // Завершить изучение
  complete() {
    this.isPlaying = false;
    console.log(`\n🎉 Изучение завершено!`);
    console.log(`✅ Выполнено ${this.recommendedRepetitions} повторений`);
    console.log(`📈 Прогресс: 100%`);
    
    // Обновить статистику материала
    this.updateMaterialStats();
  }

  // Обновить статистику материала
  updateMaterialStats() {
    console.log(`📊 Обновляем статистику материала...`);
    // Здесь был бы API вызов для обновления playCount и lastPlayed
  }

  // Показать информацию о материале
  showMaterialInfo() {
    console.log(`\n📋 Информация о материале:`);
    console.log(`  Название: ${this.material.title}`);
    console.log(`  Язык: ${this.material.sourceLanguage}`);
    console.log(`  Переводы: ${this.material.targetLanguage.join(', ')}`);
    console.log(`  Сложность: ${this.material.difficultyLevel}`);
    console.log(`  Категория: ${this.material.category}`);
    console.log(`  Автор: ${this.material.author}`);
    console.log(`  Рекомендуемые повторения: ${this.recommendedRepetitions}`);
  }
}

// Примеры материалов с разными настройками повторений
const materials = [
  {
    id: "material-1",
    title: "Приветствие на польском",
    sourceLanguage: "pl",
    targetLanguage: ["ru", "en"],
    duration: 60,
    estimatedTime: 10,
    difficultyLevel: "A1",
    category: "conversation",
    recommendedRepetitions: 3, // Для начинающих - меньше повторений
    averageRating: 4.2,
    ratingCount: 8
  },
  {
    id: "material-2", 
    title: "Деловая встреча на польском",
    sourceLanguage: "pl",
    targetLanguage: ["ru", "en", "de"],
    duration: 300,
    estimatedTime: 30,
    difficultyLevel: "B2",
    category: "business",
    recommendedRepetitions: 7, // Для сложных материалов - больше повторений
    averageRating: 4.7,
    ratingCount: 15
  },
  {
    id: "material-3",
    title: "Академическая лекция по истории",
    sourceLanguage: "pl", 
    targetLanguage: ["en"],
    duration: 1800,
    estimatedTime: 120,
    difficultyLevel: "C1",
    category: "education",
    recommendedRepetitions: 10, // Для академических материалов - много повторений
    averageRating: 4.9,
    ratingCount: 23
  }
];

// Демонстрация работы плеера
console.log('🎮 Shadowing Player Demo\n');

materials.forEach((material, index) => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Материал ${index + 1}: ${material.title}`);
  console.log(`${'='.repeat(50)}`);
  
  const player = new ShadowingPlayer(material);
  player.showMaterialInfo();
  
  // Запускаем плеер (симуляция)
  console.log('\n▶️ Запускаем плеер...');
  player.start();
  
  // Останавливаем демо через некоторое время
  setTimeout(() => {
    console.log('\n⏹️ Демо остановлено\n');
  }, 5000);
});

console.log('\n💡 Рекомендации по настройке повторений:');
console.log('  - A1-A2: 3-5 повторений (базовые фразы)');
console.log('  - B1-B2: 5-8 повторений (диалоги, новости)');
console.log('  - C1-C2: 8-12 повторений (академические материалы)');
console.log('  - Сложные темы: +2-3 повторения');
console.log('  - Короткие материалы: -1-2 повторения'); 