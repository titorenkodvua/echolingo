import React, { useState } from 'react';
import { Save, Loader2, Eye, EyeOff } from 'lucide-react';
import { materialsApi } from '../utils/api';
import type { Material, Transcription } from '../types';

interface MaterialPublishProps {
  material: Material;
  transcription?: Transcription;
  onPublished?: (material: Material) => void;
  onCancel?: () => void;
}

export const MaterialPublish: React.FC<MaterialPublishProps> = ({ 
  material, 
  transcription,
  onPublished, 
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    title: material.title || '',
    description: material.description || '',
    difficultyLevel: material.difficultyLevel || 'A1' as Material['difficultyLevel'],
    tags: material.tags || [],
    category: material.category || '',
    isPublic: material.isPublic !== undefined ? material.isPublic : true,
    recommendedRepetitions: material.recommendedRepetitions || 5
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTranscription, setShowTranscription] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'tags') {
      const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag);
      setFormData(prev => ({ ...prev, tags }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await materialsApi.publishMaterial(material.id, {
        title: formData.title,
        description: formData.description,
        tags: formData.tags,
        difficultyLevel: formData.difficultyLevel,
        category: formData.category,
        isPublic: formData.isPublic,
        recommendedRepetitions: formData.recommendedRepetitions
      });
      
      if (response.success && response.data) {
        onPublished?.(response.data);
      } else {
        throw new Error(response.error || 'Failed to publish material');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const difficultyLevels = [
    { value: 'A1', label: 'A1 - Beginner' },
    { value: 'A2', label: 'A2 - Elementary' },
    { value: 'B1', label: 'B1 - Intermediate' },
    { value: 'B2', label: 'B2 - Upper Intermediate' },
    { value: 'C1', label: 'C1 - Advanced' },
    { value: 'C2', label: 'C2 - Mastery' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Publish Material</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Material Info */}
        <div className="bg-gray-50 rounded-md p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">{material.title}</h3>
          <p className="text-sm text-gray-600">
            {material.sourceLanguage} → {material.targetLanguage.join(', ')}
          </p>
          {material.duration && (
            <p className="text-sm text-gray-600">
              Duration: {Math.round(material.duration / 60)} minutes
            </p>
          )}
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title
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

        {/* Description */}
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

        {/* Difficulty and Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              {difficultyLevels.map(level => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

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
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags.join(', ')}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="e.g., business, travel, conversation"
          />
        </div>

        {/* Settings */}
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
        {transcription && (
          <div className="bg-gray-50 rounded-md p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-700">Transcription Preview</h3>
              <button
                type="button"
                onClick={() => setShowTranscription(!showTranscription)}
                className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
              >
                {showTranscription ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-1" />
                    Hide
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-1" />
                    Show
                  </>
                )}
              </button>
            </div>
            
            {showTranscription ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  {transcription.full_transcript?.substring(0, 300)}...
                </p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>{transcription.sentences?.length || 0} sentences</span>
                  <span>{transcription.count_of_speakers || 0} speakers</span>
                  {transcription.duration && (
                    <span>{Math.round(transcription.duration / 60)} minutes</span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                Click &quot;Show&quot; to preview the transcription
              </p>
            )}
          </div>
        )}

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
                Publishing...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Publish Material
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

