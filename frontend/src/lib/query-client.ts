import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 минут
      // cacheTime: 10 * 60 * 1000, // 10 минут — если ошибка, закомментировать
      retry: 3,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error: unknown) => {
        // eslint-disable-next-line no-console
        console.error('Mutation error:', error);
      },
    },
  },
}); 