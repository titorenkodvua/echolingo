# Echolingo Frontend

Frontend приложение для изучения языков по аудиоматериалам с использованием методики Shadowing.

## Описание

React приложение с современным UI для работы с аудиоматериалами, транскрипциями и плейлистами. Включает интерактивный плеер для shadowing с возможностью настройки повторений и пауз.

---

## Новая архитектура (2024)

### Основные технологии
- **React 18** + **Vite**
- **Tailwind CSS** + **DaisyUI** (UI-компоненты)
- **@tanstack/react-query** (серверное состояние, кэширование)
- **sonner** (уведомления)
- **react-hook-form** + **zod** (валидация форм)
- **clsx** + **tailwind-merge** (утилиты для классов)

### Архитектурные паттерны
- Централизованное управление серверным состоянием через TanStack Query
- Провайдеры для Query и Toast (уведомления)
- Переиспользуемые UI-компоненты (DaisyUI)
- API-хуки для работы с backend (CRUD для материалов)
- Barrel-экспорты для хуков и компонентов
- Path aliases для удобных импортов

### Структура провайдеров

```
<AppProviders>
  <QueryProvider>
    <ToastProvider>
      <App />
    </ToastProvider>
  </QueryProvider>
</AppProviders>
```

- **QueryProvider** — инициализация TanStack Query, Devtools в dev-режиме
- **ToastProvider** — глобальные уведомления через sonner

### Пример использования API-хуков

```tsx
import { useMaterials, useCreateMaterial } from '@/hooks/api';

function MaterialsPage() {
  const { data, isLoading, error } = useMaterials();
  const createMaterial = useCreateMaterial();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.materials.map(m => (
        <div key={m.id}>{m.title}</div>
      ))}
      <button onClick={() => createMaterial.mutate({ title: 'New' })}>
        Add
      </button>
    </div>
  );
}
```

### Path Aliases

Для удобства импорта используются алиасы (настроены в vite.config.ts):

- `@/` → `src/`
- `@/components` → `src/components`
- `@/hooks` → `src/hooks`
- `@/lib` → `src/lib`
- `@/providers` → `src/providers`

Пример:
```tsx
import { Button } from '@/components/ui';
import { useMaterials } from '@/hooks/api';
```

### Организация компонентов

- **src/components/ui/** — базовые UI-компоненты (Button, LoadingSpinner и др.)
- **src/components/materials/** — доменные компоненты (MaterialCard, MaterialsList)
- **src/hooks/api/** — хуки для работы с API (useMaterials, useCreateMaterial и др.)
- **src/lib/** — утилиты и конфиг QueryClient
- **src/providers/** — провайдеры контекста

### Пример UI-компонента (Button)

```tsx
import { Button } from '@/components/ui';

<Button variant="primary" size="sm" loading={isLoading}>
  Save
</Button>
```

### Пример Toast

```tsx
import { useToast } from '@/providers/toast-provider';

const toast = useToast();
toast.success('Успешно!');
```

---

## Установка и запуск

### Предварительные требования

- Node.js 16+
- Backend сервер (должен быть запущен на порту 3001)

### Установка зависимостей

```bash
npm install
```

### Запуск в режиме разработки

```bash
npm run dev
```

Приложение будет доступно по адресу: `http://localhost:3000`

### Сборка для продакшена

```bash
npm run build
```

### Предварительный просмотр сборки

```bash
npm run preview
```

---

## Линтинг

```bash
# Проверка кода
npm run lint

# Автоматическое исправление
npm run lint:fix
```

---

## Старый раздел (до рефакторинга)

<details>
<summary>Показать</summary>

// ... (оставляю старое описание для истории, см. предыдущую версию)

</details>

## Основные компоненты

### Страницы
- **Home** - Главная страница с обзором материалов
- **Upload** - Загрузка новых аудиофайлов
- **Materials** - Управление материалами
- **Playlists** - Управление плейлистами
- **Player** - Интерактивный плеер для shadowing
- **Profile** - Профиль пользователя

### Компоненты
- **AudioUploader** - Загрузка аудиофайлов
- **MaterialCard** - Карточка материала
- **PlaylistCard** - Карточка плейлиста
- **ShadowingPlayer** - Плеер для shadowing
- **TranscriptionViewer** - Просмотр транскрипции
- **SegmentEditor** - Редактирование сегментов

## Технологии

- **React 18** - Основной фреймворк
- **Vite** - Сборщик и dev сервер
- **React Router** - Маршрутизация
- **Tailwind CSS** - Стилизация
- **Axios** - HTTP клиент
- **Web Audio API** - Работа с аудио
- **Lucide React** - Иконки

## Структура проекта

```
frontend/
├── public/              # Статические файлы
├── src/
│   ├── components/      # React компоненты
│   │   ├── ui/         # Базовые UI компоненты
│   │   ├── forms/      # Формы
│   │   └── layout/     # Компоненты макета
│   ├── pages/          # Страницы приложения
│   ├── hooks/          # Кастомные React хуки
│   ├── services/       # API сервисы
│   ├── utils/          # Утилиты
│   ├── styles/         # Стили
│   ├── App.jsx         # Главный компонент
│   └── main.jsx        # Точка входа
├── package.json        # Зависимости
├── vite.config.js      # Конфигурация Vite
├── tailwind.config.js  # Конфигурация Tailwind
└── README.md          # Документация
```

## API интеграция

Frontend интегрируется с backend API через следующие сервисы:

- **AudioService** - загрузка и управление аудиофайлами
- **TranscriptionService** - работа с транскрипциями
- **MaterialService** - управление материалами
- **PlaylistService** - управление плейлистами

## Особенности плеера

### Shadowing режим
- Автоматическое воспроизведение по сегментам
- Настраиваемое количество повторений
- Паузы между повторениями для практики
- Отображение текста и перевода
- Возможность пропуска сегментов

### Управление
- Play/Pause
- Перемотка вперед/назад
- Регулировка скорости
- Переключение между сегментами
- Настройка громкости

## Разработка

### Добавление новых компонентов

1. Создайте компонент в папке `src/components/`
2. Добавьте стили с помощью Tailwind CSS
3. Создайте страницу в папке `src/pages/` если нужно
4. Добавьте маршрут в `App.jsx`

### Стилизация

Проект использует Tailwind CSS для стилизации. Основные классы:

- `container` - контейнер с максимальной шириной
- `card` - карточка с тенью и скругленными углами
- `btn` - кнопка с различными вариантами
- `input` - поле ввода
- `text-primary` - основной цвет текста

## Следующие шаги

- [ ] Добавить аутентификацию
- [ ] Реализовать офлайн режим
- [ ] Добавить прогресс обучения
- [ ] Интеграция с базой данных
- [ ] PWA функциональность 