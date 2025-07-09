import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      refetchOnWindowFocus: true, // ✅ Включаем обновление при фокусе
      refetchOnReconnect: 'always',
      // ✅ Разумный staleTime для материалов
      staleTime: 10 * 1000, // 10 секунд - баланс между производительностью и актуальностью
    },
    mutations: {
      // ✅ Ограничиваем количество попыток для мутаций
      retry: 1,
      onError: (error: unknown) => {
        // eslint-disable-next-line no-console
        console.error('Mutation error:', error);
      },
    },
  },
}); 