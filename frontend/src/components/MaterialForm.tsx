import React, { useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { materialsApi } from '../utils/api';
import type { Transcription, Material } from '../types';

interface MaterialFormProps {
  transcription: Transcription;
  onMaterialCreated?: (material: Material) => void;
  onCancel?: () => void;
}

export const MaterialForm: React.FC<MaterialFormProps> = ({ 
  transcription, 
  onMaterialCreated, 
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficultyLevel: 'A1' as Material['difficultyLevel'],
    language: '',
    targetLanguage: [] as string[],
    tags: [] as string[],
    isPublic: true,
    category: '',
    recommendedRepetitions: 5
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'targetLanguage') {
      const languages = value.split(',').map(lang => lang.trim()).filter(lang => lang);
      setFormData(prev => ({ ...prev, targetLanguage: languages }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({ ...prev, tags }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!formData.targetLanguage || formData.targetLanguage.length === 0) {
      setError('At least one target language is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const materialData = {
        ...formData,
        audioFileName: transcription.originalFileName,
        transcriptionId: transcription.id,
        userId: 'anonymous', // TODO: Get from auth context
        duration: transcription.duration,
        estimatedTime: transcription.duration ? Math.ceil(transcription.duration / 60) : null,
        averageRating: null,
        ratingCount: 0,
        status: 'published' as const,
        playCount: 0,
        lastPlayed: null
      };

      const response = await materialsApi.create(materialData);
      
      if (response.success && response.data) {
        onMaterialCreated?.(response.data);
      } else {
        throw new Error(response.error || 'Failed to create material');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-base-100 rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-base-content mb-6">Create Learning Material</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-base-content mb-2">Title</label>
          <input
            id="title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleInputChange}
            className="input input-bordered w-full"
            required
            maxLength={120}
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-base-content mb-2">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="textarea textarea-bordered w-full"
            rows={3}
            placeholder="Enter material description"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="difficultyLevel" className="block text-sm font-medium text-base-content mb-2">Difficulty Level</label>
            <select
              id="difficultyLevel"
              name="difficultyLevel"
              value={formData.difficultyLevel}
              onChange={handleInputChange}
              className="select select-bordered w-full"
              required
            >
              <option value="A1">A1 - Beginner</option>
              <option value="A2">A2 - Elementary</option>
              <option value="B1">B1 - Intermediate</option>
              <option value="B2">B2 - Upper Intermediate</option>
              <option value="C1">C1 - Advanced</option>
              <option value="C2">C2 - Mastery</option>
            </select>
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-base-content mb-2">Category</label>
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="input input-bordered w-full"
              placeholder="e.g., Business, Travel, Daily Life"
            />
          </div>
        </div>
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-base-content mb-2">Tags (comma-separated)</label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags.join(', ')}
            onChange={handleTagsChange}
            className="input input-bordered w-full"
            placeholder="e.g., business, travel, conversation"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="recommendedRepetitions" className="block text-sm font-medium text-base-content mb-2">Recommended Repetitions</label>
            <input
              type="number"
              id="recommendedRepetitions"
              name="recommendedRepetitions"
              value={formData.recommendedRepetitions}
              onChange={handleInputChange}
              min="1"
              max="10"
              className="input input-bordered w-full"
            />
          </div>
          <div className="flex items-center mt-6 md:mt-0">
            <input
              type="checkbox"
              id="isPublic"
              name="isPublic"
              checked={formData.isPublic}
              onChange={handleInputChange}
              className="checkbox checkbox-primary"
            />
            <label htmlFor="isPublic" className="ml-2 block text-sm text-base-content">Make this material public</label>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          {onCancel && (
            <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>
          )}
          <button type="submit" className="btn btn-primary">{isSubmitting ? 'Creating...' : 'Create Material'}</button>
        </div>
      </form>
      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}; 
