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
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Learning Material</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter material title"
              required
            />
          </div>

          <div>
            <label htmlFor="difficultyLevel" className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty Level
            </label>
            <select
              id="difficultyLevel"
              name="difficultyLevel"
              value={formData.difficultyLevel}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="A1">A1 - Beginner</option>
              <option value="A2">A2 - Elementary</option>
              <option value="B1">B1 - Intermediate</option>
              <option value="B2">B2 - Upper Intermediate</option>
              <option value="C1">C1 - Advanced</option>
              <option value="C2">C2 - Mastery</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="Enter material description"
          />
        </div>

        {/* Language Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
              Language (detected)
            </label>
            <input
              type="text"
              id="language"
              name="language"
              value={formData.language}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., en, es, fr"
              readOnly
            />
          </div>

          <div>
            <label htmlFor="targetLanguage" className="block text-sm font-medium text-gray-700 mb-2">
              Target Language
            </label>
            <input
              type="text"
              id="targetLanguage"
              name="targetLanguage"
              value={formData.targetLanguage.join(', ')}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., en, es, fr"
            />
          </div>
        </div>

        {/* Additional Information */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., Business, Travel, Daily Life"
            />
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags.join(', ')}
            onChange={handleTagsChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="e.g., business, travel, conversation"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="recommendedRepetitions" className="block text-sm font-medium text-gray-700 mb-2">
              Recommended Repetitions
            </label>
            <input
              type="number"
              id="recommendedRepetitions"
              name="recommendedRepetitions"
              value={formData.recommendedRepetitions}
              onChange={handleInputChange}
              min="1"
              max="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublic"
              name="isPublic"
              checked={formData.isPublic}
              onChange={handleInputChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-900">
              Make this material public
            </label>
          </div>
        </div>

        {/* Transcription Preview */}
        <div className="bg-gray-50 rounded-md p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Transcription Preview</h3>
          <p className="text-sm text-gray-600">
            {transcription.full_transcript?.substring(0, 200)}...
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {transcription.sentences?.length || 0} sentences, {transcription.count_of_speakers || 0} speakers
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-error-50 border border-error-200 rounded-md p-3">
            <p className="text-sm text-error-700">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Material
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}; 