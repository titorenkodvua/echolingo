import axios from 'axios';
import type { ApiResponse, Transcription, Material, MaterialsListResponse } from '../types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Transcription API
export const transcriptionApi = {
  // Start transcription
  start: async (file: File, userId: string, sourceLanguage?: string): Promise<ApiResponse<{ transcriptionId: string; predictionId: string }>> => {
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('userId', userId);
    if (sourceLanguage) {
      formData.append('options', JSON.stringify({ language: sourceLanguage }));
    }
    const response = await api.post('/transcription/upload-and-transcribe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Wait for transcription completion
  wait: async (predictionId: string): Promise<ApiResponse<any>> => {
    console.log(`🚀 [API] Calling /transcription/status/${predictionId}`);
    const response = await api.get(`/transcription/status/${predictionId}`);
    console.log(`📨 [API] Response for ${predictionId}:`, response.data);
    return response.data;
  },

  // Get transcription status
  getStatus: async (predictionId: string): Promise<ApiResponse<{ transcriptionId: string; status: string }>> => {
    const response = await api.get(`/transcription/status/${predictionId}`);
    return response.data;
  },

  // Get transcription by ID
  getById: async (transcriptionId: string): Promise<ApiResponse<Transcription>> => {
    const response = await api.get(`/transcription/${transcriptionId}`);
    return response.data;
  },
};

// Materials API
export const materialsApi = {
  // Create draft material
  createDraft: async (draftData: { title: string; targetLanguage: string[]; userId?: string; language?: string }): Promise<ApiResponse<Material>> => {
    const response = await api.post('/materials/draft', draftData);
    return response.data;
  },

  // Upload file to material
  uploadFile: async (materialId: string, file: File, language?: string): Promise<ApiResponse<{ materialId: string; predictionId: string; status: string }>> => {
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('autoPolling', 'true'); // ✅ Включаем auto-polling backend
    if (language) {
      formData.append('options', JSON.stringify({ language }));
    }
    const response = await api.put(`/materials/${materialId}/upload-file`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Publish material
  publishMaterial: async (materialId: string, publishData: {
    title?: string;
    description?: string;
    tags?: string[];
    difficultyLevel?: Material['difficultyLevel'];
    category?: string;
    isPublic?: boolean;
    recommendedRepetitions?: number;
  }): Promise<ApiResponse<Material>> => {
    const response = await api.put(`/materials/${materialId}/publish`, publishData);
    return response.data;
  },

  // Get drafts
  getDrafts: async (userId: string = 'anonymous'): Promise<ApiResponse<Material[]>> => {
    const response = await api.get(`/materials/drafts?userId=${userId}`);
    return response.data;
  },

  // Create material (legacy method)
  create: async (materialData: Partial<Material>): Promise<ApiResponse<Material>> => {
    const response = await api.post('/materials', materialData);
    return response.data;
  },

  // Get all materials
  getAll: async (userId: string = 'anonymous'): Promise<ApiResponse<MaterialsListResponse>> => {
    const response = await api.get(`/materials?userId=${userId}`);
    return response.data;
  },

  // Get material by ID
  getById: async (id: string): Promise<ApiResponse<Material>> => {
    const response = await api.get(`/materials/${id}`);
    return response.data;
  },

  // Update material
  update: async (id: string, materialData: Partial<Material>): Promise<ApiResponse<Material>> => {
    const response = await api.put(`/materials/${id}`, materialData);
    return response.data;
  },

  // Delete material
  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/materials/${id}`);
    return response.data;
  },
};

export default api; 