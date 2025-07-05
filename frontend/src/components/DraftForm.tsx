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
    targetLanguage: ['ru'],
    difficultyLevel: 'A1',
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
          <label htmlFor="language" className="block text-sm font-medium text-base-content mb-2">Language</label>
          <select
            id="language"
            name="language"
            value={formData.targetLanguage.join(', ')}
            onChange={handleInputChange}
            className="select select-bordered w-full"
            required
          >
            <option value="">Select language</option>
            <option value="pl">Polish</option>
            <option value="en">English</option>
            <option value="ru">Russian</option>
            <option value="de">German</option>
            <option value="fr">French</option>
            <option value="es">Spanish</option>
            <option value="it">Italian</option>
            <option value="pt">Portuguese</option>
            <option value="ja">Japanese</option>
            <option value="ko">Korean</option>
            <option value="zh">Chinese</option>
            <option value="ar">Arabic</option>
          </select>
        </div>
        <div>
          <label htmlFor="difficultyLevel" className="block text-sm font-medium text-base-content mb-2">Difficulty Level</label>
          <select
            id="difficultyLevel"
            name="difficultyLevel"
            value={formData.difficultyLevel || ''}
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
        <div className="flex justify-end gap-2 mt-6">
          {onCancel && (
            <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>
          )}
          <button type="submit" className="btn btn-primary">Create Material</button>
        </div>
      </form>
    </div>
  );
}; 