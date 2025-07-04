import React, { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { materialsApi } from '../utils/api';
import type { Material } from '../types';

interface DraftFormProps {
  onDraftCreated?: (material: Material) => void;
  onCancel?: () => void;
}

export const DraftForm: React.FC<DraftFormProps> = ({ 
  onDraftCreated, 
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    targetLanguage: ['ru']
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'targetLanguage') {
      const languages = value.split(',').map(lang => lang.trim()).filter(lang => lang);
      setFormData(prev => ({ ...prev, targetLanguage: languages }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (formData.targetLanguage.length === 0) {
      setError('At least one target language is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await materialsApi.createDraft({
        title: formData.title,
        targetLanguage: formData.targetLanguage,
        userId: 'anonymous' // TODO: Get from auth context
      });
      
      if (response.success && response.data) {
        onDraftCreated?.(response.data);
      } else {
        throw new Error(response.error || 'Failed to create draft');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg p-6 max-w-md mx-auto">
      <h2 className="text-xl font-semibold text-base-content mb-6">Create New Material</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-base-content mb-2">
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-base-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            placeholder="Enter material title"
            required
          />
        </div>

        {/* Target Languages */}
        <div>
          <label htmlFor="targetLanguage" className="block text-sm font-medium text-base-content mb-2">
            Target Languages * (comma-separated)
          </label>
          <input
            type="text"
            id="targetLanguage"
            name="targetLanguage"
            value={formData.targetLanguage.join(', ')}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-base-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            placeholder="e.g., ru, pl, en"
            required
          />
          <p className="text-xs text-base-content/60 mt-1">
            Available codes: en, ru, pl, de, fr, es, it, pt, ja, ko, zh, ar
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-error/10 border border-error rounded-md p-3">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4 mr-2" />
                Next
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}; 