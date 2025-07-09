import React, { useState, useRef, useEffect } from 'react';
import { Save, Loader2, Eye, EyeOff } from 'lucide-react';
import { materialsApi } from '../utils/api';
import type { Material, Transcription } from '../types';
import { SegmentedTranscriptionView } from './SegmentedTranscriptionView';
import { useUpdateMaterial } from '../hooks/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface MaterialPublishProps {
  material: Material;
  transcription?: Transcription;
  onPublished?: (material: Material) => void;
  onCancel?: () => void;
}

export const MaterialEdit: React.FC<MaterialPublishProps> = ({ 
  material, 
  transcription: initialTranscription,
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
  const [editingTitle, setEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [transcription, setTranscription] = useState<Transcription | undefined>(initialTranscription);

  const isPublished = material.status === 'published';
  const isReady = material.status === 'ready';
  const isDraft = material.status === 'draft';
  const mode = isPublished ? 'edit' : 'publish';

  const updateMaterial = useUpdateMaterial();
  const queryClient = useQueryClient();
  const publishMaterialMutation = useMutation({
    mutationFn: (data: any) => materialsApi.publishMaterial(material.id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      if (response.success && response.data) {
        onPublished?.(response.data);
      }
    },
    onError: (err: any) => {
      setError(err?.message || 'Unknown error occurred');
    },
    onSettled: () => setIsSubmitting(false),
  });

  // Если transcription не передан, пробуем загрузить его по material.transcriptionId
  useEffect(() => {
    let ignore = false;
    async function fetchTranscription() {
      if (!initialTranscription && material.transcriptionId) {
        try {
          const resp = await materialsApi.getById(material.id);
          if (resp.success && resp.data && resp.data.transcription && !ignore) {
            setTranscription(resp.data.transcription);
          }
        } catch {}
      }
    }
    fetchTranscription();
    return () => { ignore = true; };
  }, [material.id, material.transcriptionId, initialTranscription]);

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
    if (mode === 'edit') {
      updateMaterial.mutate(
        { id: material.id, data: {
          title: formData.title,
          description: formData.description,
          tags: formData.tags,
          difficultyLevel: formData.difficultyLevel,
          category: formData.category,
          isPublic: formData.isPublic,
          recommendedRepetitions: formData.recommendedRepetitions
        } },
        {
          onSuccess: (data: any) => {
            if (data.success && data.data) {
              onPublished?.(data.data);
            } else {
              setError(data.error || 'Failed to save material');
            }
          },
          onError: (err: any) => {
            setError(err?.message || 'Unknown error occurred');
          },
          onSettled: () => setIsSubmitting(false)
        }
      );
    } else {
      publishMaterialMutation.mutate({
        title: formData.title,
        description: formData.description,
        tags: formData.tags,
        difficultyLevel: formData.difficultyLevel,
        category: formData.category,
        isPublic: formData.isPublic,
        recommendedRepetitions: formData.recommendedRepetitions
      });
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

  const handleTitleClick = () => {
    setEditingTitle(true);
    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 0);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, title: e.target.value }));
  };

  const handleTitleBlur = () => {
    setEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setEditingTitle(false);
    }
  };

  return (
    <div className="card bg-base-100 border border-base-200 shadow rounded-box max-w-2xl mx-auto">
      {/* Material Info */}
      <div className="bg-neutral text-neutral-content rounded-t-box p-4 mb-4">
            {editingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={formData.title}
                onChange={handleTitleChange}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                className="text-xl font-medium bg-neutral text-neutral-content border-b border-primary/60 focus:outline-none focus:border-primary-focus w-full mb-2"
                maxLength={120}
              />
            ) : (
              <h3
                className="text-xl font-medium mb-2 cursor-pointer hover:underline"
                onClick={handleTitleClick}
                title="Click to edit title"
              >
                {formData.title || 'Untitled'}
              </h3>
            )}
            < p className="text-sm opacity-70">
              {material.language} → {material.targetLanguage.join(', ')}
            </p>
            {material.duration && (
              <p className="text-sm opacity-70">
                Duration: {Math.round(material.duration / 60)} minutes
              </p>
            )}
      </div>
      <div className="card-body p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-base-content mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="textarea textarea-bordered w-full"
              placeholder="Enter material description"
            />
          </div>

          {/* Difficulty and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="difficultyLevel" className="block text-sm font-medium text-base-content mb-2">
                Difficulty Level
              </label>
              <select
                id="difficultyLevel"
                name="difficultyLevel"
                value={formData.difficultyLevel}
                onChange={handleInputChange}
                className="select select-bordered w-full"
                required
              >
                {difficultyLevels.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-base-content mb-2">
                Category
              </label>
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

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-base-content mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags.join(', ')}
              onChange={handleInputChange}
              className="input input-bordered w-full"
              placeholder="e.g., business, travel, conversation"
            />
          </div>

          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="recommendedRepetitions" className="block text-sm font-medium text-base-content mb-2">
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
                className="input input-bordered w-full"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublic"
                name="isPublic"
                checked={formData.isPublic}
                onChange={handleInputChange}
                className="toggle toggle-primary"
              />
              <label htmlFor="isPublic" className="ml-2 block text-sm text-base-content">
                Make this material public
              </label>
            </div>
          </div>

          {/* Transcription Preview */}
          {transcription && (
            <div className="bg-base-200 rounded-md p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-base-content">Transcription Preview</h3>
                <button
                  type="button"
                  onClick={() => setShowTranscription(!showTranscription)}
                  className="inline-flex items-center text-sm text-primary hover:text-primary-focus"
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
                <SegmentedTranscriptionView transcription={transcription} />
              ) : (
                <p className="text-sm text-base-content/70">
                  Click &quot;Show&quot; to preview the transcription
                </p>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="card-actions flex justify-end gap-2 mt-6">
            {onCancel && (
              <button
                type="button"
                className="btn btn-accent"
                onClick={onCancel}
              >
                Back
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {mode === 'edit' ? 'Saving...' : 'Publishing...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {mode === 'edit' ? 'Save changes' : 'Publish Material'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

