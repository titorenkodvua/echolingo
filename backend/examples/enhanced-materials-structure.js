// Пример расширенной структуры материалов с новыми полями
const enhancedMaterialExample = {
  // Основные поля (уже реализованы)
  id: "material-123",
  title: "Польский диалог о погоде",
  description: "Разговор двух людей о дожде и понедельниках",
  audioFileName: "weather-dialogue.mp3",
  transcriptionId: "transcription-123.json",
  userId: "user-456",
  tags: ["польский", "диалог", "погода"],
  isPublic: true,
  difficultyLevel: "A2",
  status: "active",
  playCount: 42,
  lastPlayed: "2025-06-27T21:30:00.000Z",
  createdAt: "2025-06-27T20:00:00.000Z",
  updatedAt: "2025-06-27T21:30:00.000Z",

  // Новые поля высокого приоритета
  sourceLanguage: "pl",           // Исходный язык
  targetLanguage: "ru",           // Целевой язык для перевода
  duration: 180,                  // Длительность в секундах (3 минуты)
  estimatedTime: 15,              // Оценка времени изучения (минуты)
  averageRating: 4.5,             // Средняя оценка (1-5)
  ratingCount: 12,                // Количество оценок
  category: "conversation",       // Основная категория

  // Новые поля среднего приоритета
  fileSize: 2048576,              // Размер файла в байтах (2MB)
  audioFormat: "mp3",             // Формат аудио
  vocabularyCount: 45,            // Количество уникальных слов
  grammarTopics: ["present_tense", "weather_vocabulary"],
  completionRate: 78.5,           // Процент завершения
  favoriteCount: 8,               // Количество добавлений в избранное
  author: "Echolingo Team",       // Автор материала
  subcategory: "daily_life",      // Подкатегория
  topic: "weather",               // Тема материала

  // Новые поля низкого приоритета
  version: "1.0",                 // Версия материала
  processingStatus: "completed",  // Статус обработки
  license: "CC-BY-NC",            // Лицензия использования
  points: 150,                    // Очки за изучение
  qualityScore: 4.2,              // Оценка качества аудио
  context: "casual_conversation", // Контекст использования
  ageGroup: "adult",              // Возрастная группа
  attribution: "Original recording by Echolingo"
};

// Примеры категорий
const materialCategories = {
  conversation: "Разговоры и диалоги",
  news: "Новости и репортажи",
  education: "Образовательный контент",
  entertainment: "Развлекательный контент",
  business: "Деловая речь",
  travel: "Путешествия и туризм",
  culture: "Культура и традиции",
  technology: "Технологии и наука",
  health: "Здоровье и медицина",
  sports: "Спорт и активность"
};

// Примеры подкатегорий
const materialSubcategories = {
  daily_life: "Повседневная жизнь",
  shopping: "Покупки и торговля",
  food: "Еда и рестораны",
  transportation: "Транспорт",
  family: "Семья и отношения",
  work: "Работа и карьера",
  hobbies: "Хобби и увлечения",
  weather: "Погода и климат",
  time: "Время и даты",
  emotions: "Эмоции и чувства"
};

// Примеры грамматических тем
const grammarTopics = {
  present_tense: "Настоящее время",
  past_tense: "Прошедшее время",
  future_tense: "Будущее время",
  conditionals: "Условные предложения",
  passive_voice: "Пассивный залог",
  reported_speech: "Косвенная речь",
  modal_verbs: "Модальные глаголы",
  prepositions: "Предлоги",
  articles: "Артикли",
  pronouns: "Местоимения",
  adjectives: "Прилагательные",
  adverbs: "Наречия",
  conjunctions: "Союзы",
  weather_vocabulary: "Лексика погоды",
  food_vocabulary: "Лексика еды",
  travel_vocabulary: "Лексика путешествий"
};

// Примеры контекстов использования
const usageContexts = {
  casual_conversation: "Неформальная беседа",
  formal_meeting: "Формальная встреча",
  academic_lecture: "Академическая лекция",
  business_presentation: "Деловая презентация",
  interview: "Собеседование",
  customer_service: "Обслуживание клиентов",
  social_media: "Социальные сети",
  public_speaking: "Публичные выступления",
  storytelling: "Рассказывание историй",
  instruction: "Инструкции и объяснения"
};

// Примеры возрастных групп
const ageGroups = {
  children: "Дети (3-12 лет)",
  teenagers: "Подростки (13-17 лет)",
  young_adults: "Молодые взрослые (18-25 лет)",
  adults: "Взрослые (26-65 лет)",
  seniors: "Пожилые (65+ лет)",
  all_ages: "Все возрасты"
};

console.log('📋 Enhanced Material Structure Example:');
console.log(JSON.stringify(enhancedMaterialExample, null, 2));

console.log('\n🏷️ Available Categories:');
console.log(JSON.stringify(materialCategories, null, 2));

console.log('\n📚 Available Grammar Topics:');
console.log(JSON.stringify(grammarTopics, null, 2)); 