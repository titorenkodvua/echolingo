# Echolingo Backend — Техническая документация

## Архитектура слоёв

### 1. Models (`backend/models`)
- **Material** — основная сущность, описывает обучающий материал.  
  Ключевые поля:  
  - `id`, `title`, `description`, `audioFileName`, `transcriptionId`, `userId`,  
  - `tags`, `isPublic`, `difficultyLevel`, `language`, `targetLanguage`,  
  - `duration`, `estimatedTime`, `averageRating`, `ratingCount`,  
  - `category`, `author`, `recommendedRepetitions`, `status`, `playCount`, `lastPlayed`, `createdAt`, `updatedAt`.
- **Transcription** — подчинённая сущность, результат транскрипции аудиофайла.  
  Ключевые поля:  
  - `id`, `originalFileName`, `gladiaId`, `status`, `full_transcript`, `sentences`, `translation`,  
  - `count_of_speakers`, `summary`, `metadata`, `errorMessage`, `duration`, `diarization`, `createdAt`, `updatedAt`.
- **Playlist** — коллекция материалов пользователя.  
  Ключевые поля:  
  - `id`, `title`, `description`, `userId`, `isPublic`, `difficultyLevel`, `sourceLanguage`, `targetLanguage`,  
  - `category`, `tags`, `estimatedTime`, `materialCount`, `status`, `playCount`, `lastPlayed`, `createdAt`, `updatedAt`.
- **PlaylistMaterial** — связь many-to-many между Playlist и Material.

**Связи моделей:**
- Material ↔ Transcription (один-к-одному)
- Playlist ↔ Material (многие-ко-многим через PlaylistMaterial)

---

### 2. Services (`backend/services`)
- **audioService** — работа с аудиофайлами (сохранение, удаление, получение информации, конвертация, сегментация).
- **gladiaService** — интеграция с Gladia API (загрузка, запуск транскрипции, polling статуса, получение результата).
- **descriptionService** — генерация описания материала на основе транскрипции.
- **databaseService** — CRUD-операции для всех моделей, статистика, очистка старых данных.

---

### 3. Middlewares (`backend/middlewares`)
- **uploadMiddleware** — Multer-конфиг для загрузки аудиофайлов:
  - Сохраняет файлы в `uploads/{userId}`
  - Генерирует уникальные имена файлов
  - Фильтрует только аудиофайлы (по mime и расширению)
  - Ограничение размера (50MB)
  - Только один файл за раз

---

### 4. Routes (`backend/routes`)
- **audio.js**
  - POST `/api/audio/upload` — загрузка аудиофайла
  - GET `/api/audio/info/:fileName` — информация о файле
  - GET `/api/audio/download/:fileName` — скачивание файла
  - DELETE `/api/audio/:fileName` — удаление файла
  - POST `/api/audio/segment` — создание сегмента аудио

- **materials.js**
  - POST `/api/materials` — создание материала (после транскрипции)
  - POST `/api/materials/draft` — создание черновика материала (только title, targetLanguage)
  - PUT `/api/materials/:materialId/upload-file` — загрузка файла к материалу, запуск транскрипции
  - PUT `/api/materials/:materialId/publish` — публикация материала
  - GET `/api/materials` — список материалов пользователя
  - GET `/api/materials/drafts` — список черновиков
  - GET `/api/materials/public` — публичные материалы
  - GET `/api/materials/search` — поиск по материалам
  - GET `/api/materials/:materialId` — получить материал по ID
  - PUT `/api/materials/:materialId` — обновить материал
  - DELETE `/api/materials/:materialId` — удалить материал (мягкое удаление)
  - POST `/api/materials/:materialId/play` — увеличить счетчик прослушиваний

- **transcription.js**
  - POST `/api/transcription/upload-and-transcribe` — загрузка аудиофайла и запуск транскрипции (Gladia)
  - GET `/api/transcription/status/:predictionId` — статус транскрипции
  - GET `/api/transcription/wait/:predictionId` — ожидание завершения транскрипции (polling)
  - GET `/api/transcription/:transcriptionId` — получить транскрипцию по ID
  - PUT `/api/transcription/:transcriptionId/sentences` — обновить предложения транскрипции
  - GET `/api/transcription/:transcriptionId/export` — экспорт транскрипции (json, srt, vtt, txt)
  - DELETE `/api/transcription/:transcriptionId` — удалить транскрипцию

- **playlists.js**
  - POST `/api/playlists` — создать плейлист
  - GET `/api/playlists` — получить плейлисты пользователя
  - GET `/api/playlists/public` — публичные плейлисты
  - GET `/api/playlists/:playlistId` — получить плейлист по ID
  - PUT `/api/playlists/:playlistId` — обновить плейлист
  - POST `/api/playlists/:playlistId/materials` — добавить материал в плейлист
  - DELETE `/api/playlists/:playlistId/materials/:materialId` — удалить материал из плейлиста
  - PUT `/api/playlists/:playlistId/materials/reorder` — изменить порядок материалов
  - DELETE `/api/playlists/:playlistId` — удалить плейлист (мягкое удаление)
  - POST `/api/playlists/:playlistId/play` — увеличить счетчик прослушиваний

---

## Ключевые принципы

- Все языковые поля (`language`, `targetLanguage`) хранятся только в Material.
- Transcription — подчинённая сущность, не содержит языковых полей для пользователя.
- Валидация языков, уровней сложности, размеров файлов и т.д. происходит на уровне роутов.
- Загрузка и обработка аудиофайлов — через Multer и сервис audioService.
- Транскрипция — через сервис gladiaService, результат сохраняется в Transcription и обновляет Material.
- Плейлисты реализованы как отдельная сущность с возможностью добавления/удаления материалов.
- Все взаимодействие с данными — через сервисы, а не напрямую из роутов.

---

## Пример сценария создания материала

1. **POST `/api/materials/draft`** — создаётся черновик (title, targetLanguage).
2. **PUT `/api/materials/:materialId/upload-file`** — загружается аудиофайл, запускается транскрипция.
3. **GET `/api/transcription/status/:predictionId`** — polling статуса транскрипции.
4. **PUT `/api/materials/:materialId/publish`** — публикация материала (статус published).

---

**Используй эту документацию для понимания структуры, связей и API backend Echolingo.**  
Если нужно расширить или обновить этот файл — просто добавь новые детали!

--- 