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
      console.log('📊 [MATERIALS] Fetched materials:', r.data);
      return r.data;
    }),
    staleTime: 1 * 60 * 1000, // 1 минута (уменьшено с 5 минут)
    refetchInterval: (query) => {
      // Исправлена логика доступа к данным
      const materials = query?.state?.data?.materials;
      console.log('🔄 [MATERIALS] Checking refetch interval, materials:', materials?.map(m => ({ id: m.id, status: m.status })));
      
      const hasProcessingMaterials = materials?.some(m => m.status === 'processing');
      console.log('⏰ [MATERIALS] Has processing materials:', hasProcessingMaterials);
      
      return hasProcessingMaterials ? 30 * 1000 : false; // 30 секунд или отключено
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
        toast.success('Material updated');
        queryClient.invalidateQueries({ queryKey: MATERIALS_KEY });
      } else {
        toast.error(res.error || 'Failed to update material');
      }
    },
    onError: (err: Error) => {
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