I have created the following plan after thorough exploration and analysis of the codebase. Follow the below plan verbatim. Trust the files and references. Do not re-verify what's written in the plan. Explore only when absolutely necessary. First implement all the proposed file changes and then I'll review all the changes together at the end. Make sure you fix all the linting, compilation or validation issues after successful implementation of the plan.

### Observations

Пользователь просит сфокусироваться на базовых и стратегических улучшениях архитектуры, а не на глобальном рефакторинге. Нужно выделить ключевые архитектурные проблемы и предложить поэтапное решение, начиная с фундаментальных изменений.

### Approach

Сосредоточимся на базовых архитектурных улучшениях: добавление TanStack Query для управления состоянием, создание системы провайдеров, рефакторинг крупных компонентов и улучшение структуры проекта. Это создаст прочную основу для дальнейших улучшений без кардинальной переписки всего кода.

### Reasoning

Проанализировал текущую архитектуру фронтенда и выявил основные проблемы: отсутствие централизованного управления состоянием, большие компоненты с множественной ответственностью, дублирование логики и отсутствие современных паттернов React. Выбрал приоритетные изменения для улучшения архитектуры.

## Proposed File Changes

- [x] frontend/package.json(MODIFY)
- [ ] frontend/src/lib(NEW)
- [ ] frontend/src/lib/query-client.ts(NEW)
- [ ] frontend/src/lib/utils.ts(NEW)
- [ ] frontend/src/providers(NEW)
- [ ] frontend/src/providers/query-provider.tsx(NEW)
- [ ] frontend/src/providers/toast-provider.tsx(NEW)
- [ ] frontend/src/providers/index.tsx(NEW)
- [ ] frontend/src/hooks/api(NEW)
- [ ] frontend/src/hooks/api/use-materials.ts(NEW)
- [ ] frontend/src/hooks/api/index.ts(NEW)
- [ ] frontend/src/components/ui(NEW)
- [ ] frontend/src/components/ui/loading-spinner.tsx(NEW)
- [ ] frontend/src/components/ui/button.tsx(NEW)
- [ ] frontend/src/components/ui/index.ts(NEW)
- [ ] frontend/src/components/materials(NEW)
- [ ] frontend/src/components/materials/material-card.tsx(NEW)
- [ ] frontend/src/components/materials/materials-list.tsx(NEW)
- [ ] frontend/src/components/materials/index.ts(NEW)
- [ ] frontend/src/main.tsx(MODIFY)
- [x] frontend/src/pages/HomePage.tsx(MODIFY)
- [x] frontend/vite.config.ts(MODIFY)
- [x] frontend/README.md(MODIFY)

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

- `useMaterials()`