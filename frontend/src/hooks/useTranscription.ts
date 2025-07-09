import { useState, useCallback } from 'react';
import { transcriptionApi } from '../utils/api';
import type { Transcription, UploadProgress } from '../types';

export const useTranscription = () => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [transcription, setTranscription] = useState<Transcription | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startTranscription = useCallback(async (file: File, language: string = 'en', userId: string = 'anonymous') => {
    try {
      setIsProcessing(true);
      setError(null);
      
      // Set initial upload progress
      setUploadProgress({
        file,
        progress: 0,
        status: 'uploading'
      });

      // Start transcription with language
      const response = await transcriptionApi.start(file, userId, language);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to start transcription');
      }

      const { transcriptionId, predictionId } = response.data;

      // Update progress
      setUploadProgress(prev => prev ? {
        ...prev,
        progress: 50,
        status: 'transcribing',
        transcriptionId
      } : null);

      // Wait for completion
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes max
      
      while (attempts < maxAttempts) {
        attempts++;
        
        try {
          const statusResponse = await transcriptionApi.wait(predictionId);
          
          console.log('📊 [FRONTEND] Status response:', statusResponse);
          
          if (statusResponse.success && statusResponse.data) {
            // Правильная структура ответа: statusResponse.data.status
            const status = statusResponse.data.status;
            
            console.log(`📈 [FRONTEND] Current status: ${status}`);
            
            if (status === 'completed') {  // ✅ Правильный статус
              console.log('✅ [FRONTEND] Transcription completed!');
              
              // Get final transcription
              const finalResponse = await transcriptionApi.getById(transcriptionId);
              
              if (finalResponse.success && finalResponse.data) {
                setTranscription(finalResponse.data);
                setUploadProgress(prev => prev ? {
                  ...prev,
                  progress: 100,
                  status: 'completed'
                } : null);
                setIsProcessing(false);
                return finalResponse.data;
              }
            } else if (status === 'failed' || status === 'error') {
              console.log(`❌ [FRONTEND] Transcription failed with status: ${status}`);
              throw new Error(`Transcription failed: ${status}`);
            } else {
              console.log(`⏳ [FRONTEND] Status: ${status}, continuing polling...`);
            }
          }
        } catch (err) {
          console.error('Error checking status:', err);
        }

        // Wait 5 seconds before next attempt
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      throw new Error('Transcription timeout');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setUploadProgress(prev => prev ? {
        ...prev,
        status: 'error',
        error: errorMessage
      } : null);
      setIsProcessing(false);
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setUploadProgress(null);
    setTranscription(null);
    setIsProcessing(false);
    setError(null);
  }, []);

  return {
    uploadProgress,
    transcription,
    isProcessing,
    error,
    startTranscription,
    reset
  };
}; 