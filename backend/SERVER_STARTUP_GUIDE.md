# 🚀 Echolingo Server Startup Guide

## ⚠️ ВАЖНО: Запуск только из правильной директории!

### ❌ НЕПРАВИЛЬНО (вызывает ошибку "Cannot find module"):
```bash
# Из корневой директории echolingo
node server.js
npm run dev
```

### ✅ ПРАВИЛЬНО:
```bash
# 1. Перейти в директорию backend и запускаем сервер
cd backend && node server.js

# ИЛИ
cd backend && npm run dev
```

НЕПРАВИЛЬНО правильно запускать сервер сначла выаолнив переход в папку backend а потом  выолниить комманду "node server.js" 
необходимо запускать сервер только каммандой "cd backend && node server.js" где переход в папку и выполняется одной строкой

## 🛠️ Решение проблем:

### Порт занят (EADDRINUSE):
```bash
# Убить процесс на порту 3001
lsof -ti:3001 | xargs kill -9
```

### База данных повреждена:
```bash
# Удалить старую базу
rm -f database/echolingo.sqlite
# Сервер создаст новую при запуске
```

## 📍 Структура проекта:
```
echolingo/
├── backend/          ← ЗДЕСЬ ДОЛЖЕН БЫТЬ СЕРВЕР
│   ├── server.js     ← ГЛАВНЫЙ ФАЙЛ СЕРВЕРА
│   ├── package.json
│   └── ...
├── frontend/
└── ...
```

## 🎯 Команды для быстрого запуска:

```bash
# Быстрый запуск из любой директории
cd /Users/dmytro/my-projects/echolingo/backend && node server.js

# Или через npm
cd /Users/dmytro/my-projects/echolingo/backend && npm run dev
```

## ✅ Признаки успешного запуска:
- ✅ Database connection established successfully
- ✅ Database synchronized successfully  
- 🚀 Echolingo server running on port 3001
- 📚 API Documentation: http://localhost:3001/api-docs

## ❌ Признаки неправильного запуска:
- ❌ Error: Cannot find module '/Users/dmytro/my-projects/echolingo/server.js'
- ❌ Error: listen EADDRINUSE: address already in use :::3001 