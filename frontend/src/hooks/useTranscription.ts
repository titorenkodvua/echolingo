import { useState, useCallback } from 'react';
import { transcriptionApi } from '../utils/api';
import type { Transcription, UploadProgress } from '../types';

export const useTranscription = () => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [transcription, setTranscription] = useState<Transcription | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startTranscription = useCallback(async (file: File, userId: string = 'anonymous') => {
    try {
      setIsProcessing(true);
      setError(null);
      
      // Set initial upload progress
      setUploadProgress({
        file,
        progress: 0,
        status: 'uploading'
      });

      // Start transcription
      const response = await transcriptionApi.start(file, userId);
      
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
          
          if (statusResponse.success && statusResponse.data) {
            const status = statusResponse.data.status || statusResponse.data.data?.status;
            
            if (status === 'done') {
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