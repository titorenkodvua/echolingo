I have created the following plan after thorough exploration and analysis of the codebase. Follow the below plan verbatim. Trust the files and references. Do not re-verify what's written in the plan. Explore only when absolutely necessary. First implement all the proposed file changes and then I'll review all the changes together at the end. Make sure you fix all the linting, compilation or validation issues after successful implementation of the plan.

### Observations

Пользователь просит сфокусироваться на базовых и стратегических улучшениях архитектуры, а не на глобальном рефакторинге. Нужно выделить ключевые архитектурные проблемы и предложить поэтапное решение, начиная с фундаментальных изменений.

### Approach

Сосредоточимся на базовых архитектурных улучшениях: добавление TanStack Query для управления состоянием, создание системы провайдеров, рефакторинг крупных компонентов и улучшение структуры проекта. Это создаст прочную основу для дальнейших улучшений без кардинальной переписки всего кода.

### Reasoning

Проанализировал текущую архитектуру фронтенда и выявил основные проблемы: отсутствие централизованного управления состоянием, большие компоненты с множественной ответственностью, дублирование логики и отсутствие современных паттернов React. Выбрал приоритетные изменения для улучшения архитектуры.

## Proposed File Changes

### frontend/package.json(MODIFY)

Добавить ключевые зависимости для улучшения архитектуры:

- `@tanstack/react-query` и `@tanstack/react-query-devtools` для управления серверным состоянием
- `sonner` для системы уведомлений
- `clsx` и `tailwind-merge` для работы с CSS классами
- `react-hook-form` и `@hookform/resolvers` для форм
- `zod` для валидации

Эти зависимости создадут основу для современной архитектуры React приложения.

### frontend/src/lib(NEW)

Создать директорию для утилит и конфигурации.

### frontend/src/lib/query-client.ts(NEW)

Создать конфигурацию TanStack Query:

- Настроить QueryClient с оптимальными параметрами
- Добавить глобальную обработку ошибок
- Настроить retry логику и stale time
- Добавить devtools для разработки

Параметры:
- `staleTime: 5 * 60 * 1000` (5 минут)
- `cacheTime: 10 * 60 * 1000` (10 минут)
- `retry: 3` для большинства запросов
- Глобальный onError handler

### frontend/src/lib/utils.ts(NEW)

Создать базовые утилитарные функции:

- `cn()` - функция для объединения Tailwind классов (clsx + tailwind-merge)
- `formatDuration()` - форматирование времени
- `formatFileSize()` - форматирование размера файла
- `truncateText()` - обрезка текста

Эти функции используются в нескольких местах и должны быть централизованы.

### frontend/src/providers(NEW)

Создать директорию для React провайдеров.

### frontend/src/providers/query-provider.tsx(NEW)

References: 

- frontend/src/lib/query-client.ts(NEW)

Создать провайдер для TanStack Query:

- Обернуть приложение в QueryClientProvider
- Добавить ReactQueryDevtools для разработки
- Настроить error boundaries для query ошибок
- Экспортировать готовый провайдер

Использовать конфигурацию из `src/lib/query-client.ts`

### frontend/src/providers/toast-provider.tsx(NEW)

Создать провайдер для уведомлений:

- Настроить Sonner Toaster с DaisyUI темами
- Создать хук useToast для удобного использования
- Настроить позиционирование (top-right)
- Добавить поддержку разных типов уведомлений

Это заменит использование alert() в компонентах.

### frontend/src/providers/index.tsx(NEW)

Создать композитный провайдер:

- Объединить QueryProvider и ToastProvider
- Создать AppProviders компонент
- Определить правильный порядок вложенности
- Экспортировать для использования в main.tsx

Порядок: QueryProvider → ToastProvider

### frontend/src/hooks/api(NEW)

Создать директорию для API хуков с TanStack Query.

### frontend/src/hooks/api/use-materials.ts(NEW)

References: 

- frontend/src/utils/api.ts

Создать основные хуки для работы с материалами:

- `useMaterials()` - получение списка с кешированием
- `useMaterial(id)` - получение одного материала
- `useCreateMaterial()` - создание нового материала
- `useUpdateMaterial()` - обновление материала
- `useDeleteMaterial()` - удаление материала

Каждый хук должен:
- Использовать правильные query keys
- Инвалидировать связанные запросы
- Показывать toast уведомления
- Иметь типизацию

Использовать существующий API из `src/utils/api.ts`

### frontend/src/hooks/api/index.ts(NEW)

Создать barrel export для API хуков.

### frontend/src/components/ui(NEW)

Создать директорию для переиспользуемых UI компонентов.

### frontend/src/components/ui/loading-spinner.tsx(NEW)

Создать компонент загрузки:

- Использовать DaisyUI loading классы
- Поддержать разные размеры (sm, md, lg)
- Добавить опциональный текст
- Центрирование по умолчанию

Пропсы: size, text, className
Использовать вместо дублированных spinner'ов в компонентах.

### frontend/src/components/ui/button.tsx(NEW)

Создать улучшенный Button компонент:

- Расширить DaisyUI btn с loading состоянием
- Добавить поддержку иконок
- Улучшить accessibility
- Добавить варианты размеров

Пропсы: variant, size, loading, disabled, icon, children
Использовать в формах вместо обычных button элементов.

### frontend/src/components/ui/index.ts(NEW)

Создать barrel export для UI компонентов.

### frontend/src/components/materials(NEW)

Создать директорию для компонентов материалов.

### frontend/src/components/materials/material-card.tsx(NEW)

References: 

- frontend/src/pages/HomePage.tsx(MODIFY)

Извлечь карточку материала из HomePage:

- Перенести логику рендеринга одного материала
- Добавить hover эффекты
- Улучшить accessibility
- Оптимизировать с React.memo
- Использовать новые UI компоненты

Пропсы: material, onEdit, onDelete
Это значительно упростит HomePage компонент.

### frontend/src/components/materials/materials-list.tsx(NEW)

References: 

- frontend/src/pages/HomePage.tsx(MODIFY)
- frontend/src/components/materials/material-card.tsx(NEW)

Создать компонент списка материалов:

- Извлечь логику отображения списка из HomePage
- Добавить loading состояния
- Реализовать empty state
- Использовать MaterialCard компонент
- Добавить анимации появления

Пропсы: materials, loading, onEdit, onDelete
Использовать в HomePage для отображения списка.

### frontend/src/components/materials/index.ts(NEW)

Создать barrel export для компонентов материалов.

### frontend/src/main.tsx(MODIFY)

References: 

- frontend/src/providers/index.tsx(NEW)

Интегрировать провайдеры в приложение:

- Импортировать AppProviders из `src/providers`
- Обернуть App в AppProviders
- Добавить error boundary для глобальной обработки ошибок

Это создаст основу для современной архитектуры с централизованным управлением состоянием.

### frontend/src/pages/HomePage.tsx(MODIFY)

References: 

- frontend/src/hooks/api/use-materials.ts(NEW)
- frontend/src/components/materials/materials-list.tsx(NEW)

Рефакторить HomePage для использования новой архитектуры:

- Заменить useState/useEffect на useMaterials хук
- Использовать MaterialsList компонент вместо inline рендеринга
- Заменить alert() на toast уведомления
- Убрать дублированную логику состояния
- Упростить компонент с 430+ строк до ~150 строк

Основная логика: загрузка через хуки, рендеринг через компоненты, уведомления через toast.

Это демонстрирует преимущества новой архитектуры.

### frontend/vite.config.ts(MODIFY)

Добавить path aliases для удобного импорта:

- `@/` для `src/`
- `@/components` для `src/components`
- `@/hooks` для `src/hooks`
- `@/lib` для `src/lib`
- `@/providers` для `src/providers`

Это улучшит DX и сделает импорты более читаемыми.

### frontend/README.md(MODIFY)

Обновить документацию с описанием новой архитектуры:

- Описать использование TanStack Query
- Документировать структуру провайдеров
- Объяснить организацию компонентов
- Добавить примеры использования API хуков
- Описать path aliases

Это поможет команде понять новую архитектуру.