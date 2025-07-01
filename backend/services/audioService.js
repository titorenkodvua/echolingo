const fs = require('fs').promises;
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const ffprobeStatic = require('ffprobe-static');
const { v4: uuidv4 } = require('uuid');

// Настройка путей к FFmpeg и FFprobe
ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic.path);

class AudioService {
  constructor() {
    this.uploadsDir = path.join(__dirname, '..', 'uploads');
    this.allowedFormats = ['.mp3', '.wav', '.m4a', '.flac', '.ogg'];
    this.maxFileSize = 100 * 1024 * 1024; // 100MB
  }

  // Проверка формата файла
  isValidFormat(filename) {
    const ext = path.extname(filename).toLowerCase();
    return this.allowedFormats.includes(ext);
  }

  // Проверка размера файла
  isValidSize(fileSize) {
    return fileSize <= this.maxFileSize;
  }

  // Генерация уникального имени файла
  generateFileName(originalName) {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const uuid = uuidv4().substring(0, 8);
    return `${timestamp}-${uuid}${ext}`;
  }

  // Сохранение аудиофайла
  async saveAudioFile(file, userId = 'anonymous') {
    try {
      const fileName = this.generateFileName(file.originalname);
      const userDir = path.join(this.uploadsDir, userId);
      const filePath = path.join(userDir, fileName);

      // Создаем директорию пользователя если не существует
      await fs.mkdir(userDir, { recursive: true });

      // Перемещаем файл
      await fs.rename(file.path, filePath);

      return {
        originalName: file.originalname,
        fileName: fileName,
        filePath: filePath,
        size: file.size,
        mimetype: file.mimetype
      };
    } catch (error) {
      console.error('Error saving audio file:', error);
      throw new Error('Failed to save audio file');
    }
  }

  // Получение информации об аудиофайле
  async getAudioInfo(filePath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(new Error(`Failed to get audio info: ${err.message}`));
          return;
        }

        const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');
        if (!audioStream) {
          reject(new Error('No audio stream found'));
          return;
        }

        resolve({
          duration: metadata.format.duration,
          format: metadata.format.format_name,
          bitrate: metadata.format.bit_rate,
          sampleRate: audioStream.sample_rate,
          channels: audioStream.channels,
          codec: audioStream.codec_name
        });
      });
    });
  }

  // Конвертация аудио в MP3 для веб-воспроизведения
  async convertToMp3(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          '-acodec', 'libmp3lame',
          '-ab', '128k',
          '-ar', '44100',
          '-ac', '2'
        ])
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(new Error(`Conversion failed: ${err.message}`)))
        .run();
    });
  }

  // Создание сегмента аудио
  async createAudioSegment(inputPath, outputPath, startTime, duration) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          '-ss', startTime.toString(),
          '-t', duration.toString(),
          '-acodec', 'copy'
        ])
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(new Error(`Segment creation failed: ${err.message}`)))
        .run();
    });
  }

  // Удаление файла
  async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  // Проверка существования файла
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  // Получение размера файла
  async getFileSize(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch (error) {
      throw new Error(`Failed to get file size: ${error.message}`);
    }
  }

  // Создание временного файла для обработки
  async createTempFile(originalPath, suffix = '') {
    const tempDir = path.join(this.uploadsDir, 'temp');
    await fs.mkdir(tempDir, { recursive: true });
    
    const ext = path.extname(originalPath);
    const tempFileName = `temp-${Date.now()}-${uuidv4().substring(0, 8)}${suffix}${ext}`;
    const tempPath = path.join(tempDir, tempFileName);
    
    return tempPath;
  }

  // Очистка временных файлов
  async cleanupTempFiles() {
    try {
      const tempDir = path.join(this.uploadsDir, 'temp');
      const files = await fs.readdir(tempDir);
      
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 часа
      
      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await this.deleteFile(filePath);
        }
      }
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }
  }
}

module.exports = new AudioService(); 