const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Создаем папку uploads если её нет
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Конфигурация хранилища
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Определяем папку на основе userId или используем anonymous
    const userId = req.body.userId || req.query.userId || 'anonymous';
    const userDir = path.join(uploadsDir, userId);
    
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    // Генерируем уникальное имя файла
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(file.originalname);
    const filename = `${timestamp}-${randomId}${extension}`;
    
    cb(null, filename);
  }
});

// Фильтр файлов
const fileFilter = (req, file, cb) => {
  // Разрешаем только аудиофайлы
  const allowedMimeTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/m4a',
    'audio/flac',
    'audio/ogg',
    'audio/webm'
  ];
  
  const allowedExtensions = ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.webm'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Only audio files are allowed'), false);
  }
};

// Создаем экземпляр multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB максимум
    files: 1 // Только один файл
  }
});

module.exports = upload;
