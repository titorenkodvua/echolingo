import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../providers/toast-provider';
import { materialsApi } from '../../utils/api';
import type { Material, ApiResponse, MaterialsListResponse } from '../../types';

const MATERIALS_KEY = ['materials'];

export function useMaterials() {
  return useQuery<MaterialsListResponse, Error>({
    queryKey: MATERIALS_KEY,
    queryFn: () => materialsApi.getAll().then(r => {
      if (!r.success || !r.data) throw new Error(r.error || 'Failed to fetch materials');
      const processingCount = r.data.materials?.filter(m => m.status === 'processing').length || 0;
      console.log(`📊 [MATERIALS] Fetched ${r.data.materials?.length || 0} materials (${processingCount} processing)`);
      return r.data;
    }),
    // ✅ Оставляем глобальные настройки для staleTime и refetchOnWindowFocus
    refetchInterval: (query) => {
      const materials = query?.state?.data?.materials;
      const hasProcessingMaterials = materials?.some(m => m.status === 'processing');
      
      if (!hasProcessingMaterials) {
        console.log('⏸️ [POLLING] No processing materials, stopping polling');
        return false;
      }
      
      // ✅ Простое решение: быстрые обновления при наличии processing материалов
      console.log('⏰ [POLLING] Processing materials found, polling every 3 seconds');
      return 3 * 1000; // 3 секунды - оптимальный баланс скорости и нагрузки
    },
  });
}

export function useMaterial(id: string) {
  return useQuery<Material, Error>({
    queryKey: [...MATERIALS_KEY, id],
    queryFn: () => materialsApi.getById(id).then(r => {
      if (!r.success || !r.data) throw new Error(r.error || 'Failed to fetch material');
      return r.data;
    }),
    enabled: !!id,
  });
}

export function useCreateMaterial() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (data: Partial<Material>) => materialsApi.create(data),
    onSuccess: (res: ApiResponse<Material>) => {
      if (res.success && res.data) {
        toast.success('Material created');
        queryClient.invalidateQueries({ queryKey: MATERIALS_KEY });
      } else {
        toast.error(res.error || 'Failed to create material');
      }
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Material> }) => materialsApi.update(id, data),
    onSuccess: (res: ApiResponse<Material>) => {
      if (res.success && res.data) {
        console.log('✅ [UPDATE] Material updated successfully, invalidating cache');
        toast.success('Material updated');
        queryClient.invalidateQueries({ queryKey: MATERIALS_KEY });
        console.log('🔄 [CACHE] Cache invalidation triggered for materials');
      } else {
        toast.error(res.error || 'Failed to update material');
      }
    },
    onError: (err: Error) => {
      console.error('❌ [UPDATE] Update material failed:', err);
      toast.error(err.message);
    },
  });
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation<ApiResponse<void>, Error, string>({
    mutationFn: (id: string) => materialsApi.delete(id),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Material deleted');
        queryClient.invalidateQueries({ queryKey: MATERIALS_KEY });
      } else {
        toast.error(res.error || 'Failed to delete material');
      }
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
} 