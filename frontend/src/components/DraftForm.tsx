import React, { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { materialsApi, transcriptionApi } from '../utils/api';
import type { Material } from '../types';
import { useQueryClient } from '@tanstack/react-query';

interface DraftFormProps {
  onDraftCreated?: (material: Material, shouldNavigateToEdit?: boolean) => void;
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
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<'idle' | 'uploading' | 'transcribing' | 'done'>('idle');
  
  // ✅ Добавляем ref для отслеживания активности компонента
  const isComponentActiveRef = React.useRef(true);
  
  const queryClient = useQueryClient();

  // ✅ Очищаем ref только при размонтировании, не при ре-рендерах
  React.useEffect(() => {
    isComponentActiveRef.current = true; // ✅ Устанавливаем в true при монтировании
    return () => {
      console.log('🔴 [DRAFT_FORM] Component is unmounting, setting active to false');
      isComponentActiveRef.current = false;
    };
  }, []); // ✅ Пустой массив зависимостей!

  // ✅ Функция отмены с остановкой поллинга
  const handleCancel = () => {
    console.log('🚫 [DRAFT_FORM] User canceled, stopping polling');
    isComponentActiveRef.current = false;
    
    // ✅ Обновляем список материалов при закрытии формы
    console.log('🔄 [DRAFT_FORM] Invalidating materials cache on cancel');
    queryClient.invalidateQueries({ queryKey: ['materials'] });
    
    onCancel?.();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'file') {
      const files = (e.target as HTMLInputElement).files;
      setFile(files && files[0] ? files[0] : null);
      return;
    }
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
    if (!file) {
      setError('Audio file is required');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setProgress('uploading');
    try {
      // 1. Create draft
      const draftRes = await materialsApi.createDraft({
        title: formData.title,
        targetLanguage: formData.targetLanguage,
        userId: 'anonymous',
      });
      if (!draftRes.success || !draftRes.data) throw new Error(draftRes.error || 'Failed to create draft');
      const material = draftRes.data;
      
      // ✅ Обновляем кеш сразу после создания материала
      console.log('🔄 [DRAFT_FORM] Invalidating materials cache after draft creation');
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      
      // 2. Upload file
      console.log('🔄 [DRAFT_FORM] Starting file upload for material:', material.id);
      const uploadRes = await materialsApi.uploadFile(material.id, file);
      console.log('📤 [DRAFT_FORM] Upload response:', uploadRes);
      
      if (!uploadRes.success || !uploadRes.data) throw new Error(uploadRes.error || 'Failed to upload file');
      const predictionId = uploadRes.data.predictionId;
      
      if (!predictionId) {
        throw new Error('No predictionId received from upload');
      }
      
      console.log('🆔 [DRAFT_FORM] Got predictionId:', predictionId);
      setProgress('transcribing');
      
      // ✅ Обновляем кеш после начала транскрипции (статус меняется на 'processing')
      console.log('🔄 [DRAFT_FORM] Invalidating materials cache after upload start');
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      
      // 3. Poll transcription status
      let attempts = 0;
      const maxAttempts = 60;
      let status = '';
      
      while (attempts < maxAttempts && isComponentActiveRef.current) { // ✅ Проверяем активность компонента
        attempts++;
        console.log(`🔍 [DRAFT_FORM] Polling attempt ${attempts}/${maxAttempts} (active: ${isComponentActiveRef.current})`);
        
        const statusRes = await transcriptionApi.wait(predictionId);
        console.log('📊 [DRAFT_FORM] Status response:', statusRes);
        
        if (statusRes.success && statusRes.data) {
          status = statusRes.data.status || statusRes.data.data?.status;
          console.log(`📈 [DRAFT_FORM] Current status: ${status}`);
          
          if (status === 'completed') {
            console.log('✅ [DRAFT_FORM] Transcription completed!');
            break;
          } else if (status === 'failed' || status === 'error') {
            console.log(`❌ [DRAFT_FORM] Transcription failed with status: ${status}`);
            throw new Error(`Transcription failed: ${status}`);
          } else {
            console.log(`⏳ [DRAFT_FORM] Status: ${status}, continuing...`);
          }
        }
        
        // ✅ Проверяем активность перед ожиданием
        if (!isComponentActiveRef.current) {
          console.log('🚫 [DRAFT_FORM] Component unmounted, stopping polling');
          return;
        }
        
        await new Promise(res => setTimeout(res, 5000));
      }
      
      // ✅ Проверяем активность перед завершением
      if (!isComponentActiveRef.current) {
        console.log('🚫 [DRAFT_FORM] Component unmounted, canceling completion');
        return;
      }
      
      if (status !== 'completed') {
        console.log(`❌ [DRAFT_FORM] Timeout! Final status: ${status}`);
        throw new Error('Transcription timeout');
      }
      
      setProgress('done');
      
      // 4. Get updated material
      const matRes = await materialsApi.getById(material.id);
      if (!matRes.success || !matRes.data) throw new Error(matRes.error || 'Failed to fetch material');
      
      // ✅ Принудительно обновляем кеш материалов
      console.log('🔄 [DRAFT_FORM] Invalidating materials cache after transcription completion');
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      
      // ✅ Вызываем колбэк только если компонент все еще активен
      if (isComponentActiveRef.current) {
        onDraftCreated?.(matRes.data, true); // ✅ Указываем, что нужно перейти к редактированию
      } else {
        console.log('🚫 [DRAFT_FORM] Component unmounted, skipping navigation');
      }
    } catch (err) {
      // ✅ Показываем ошибку только если компонент активен
      if (isComponentActiveRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        setProgress('idle');
      }
    } finally {
      if (isComponentActiveRef.current) {
        setIsSubmitting(false);
      }
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
            name="targetLanguage"
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
        <div>
          <label htmlFor="audio" className="block text-sm font-medium text-base-content mb-2">Audio File</label>
          <input
            id="audio"
            name="audio"
            type="file"
            accept="audio/*"
            className="file-input file-input-bordered w-full"
            onChange={handleInputChange}
            required
          />
        </div>
        {error && <div className="text-error text-sm">{error}</div>}
        {progress !== 'idle' && (
          <div className="flex items-center gap-2 text-sm">
            {progress === 'uploading' && <Loader2 className="animate-spin w-4 h-4" />} Uploading & Transcribing...
          </div>
        )}
        <div className="flex justify-end gap-2 mt-6">
          {onCancel && (
            <button type="button" className="btn btn-outline" onClick={handleCancel} disabled={isSubmitting || progress !== 'idle'}>Cancel</button>
          )}
          <button type="submit" className="btn btn-primary" disabled={isSubmitting || progress !== 'idle'}>
            {isSubmitting || progress !== 'idle' ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}Create Material
          </button>
        </div>
      </form>
    </div>
  );
}; 