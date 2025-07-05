import React, { useCallback, useState } from 'react';
import { Upload, FileAudio, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { materialsApi } from '../utils/api';
import type { Material, UploadProgress } from '../types';

interface MaterialUploadProps {
  material: Material;
  onUploadComplete?: (material: Material) => void;
  onCancel?: () => void;
}

export const MaterialUpload: React.FC<MaterialUploadProps> = ({ 
  material, 
  onUploadComplete, 
  onCancel 
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFile = async (file: File) => {
    // Validate file type
    const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/flac', 'audio/ogg'];
    const allowedExtensions = ['.mp3', '.wav', '.m4a', '.flac', '.ogg'];
    
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isValidType = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension);
    
    if (!isValidType) {
      alert('Please select a valid audio file (MP3, WAV, M4A, FLAC, OGG)');
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert('File size must be less than 50MB');
      return;
    }

    try {
      setUploadProgress({
        file,
        progress: 0,
        status: 'uploading'
      });

      // Upload file to material
      const response = await materialsApi.uploadFile(material.id, file, material.language);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to upload file');
      }

      const { predictionId } = response.data;

      setUploadProgress({
        file,
        progress: 50,
        status: 'transcribing'
      });

      // Wait for transcription completion
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes max
      
      while (attempts < maxAttempts) {
        attempts++;
        
        try {
          console.log(`🔍 Checking transcription status (attempt ${attempts}/${maxAttempts})...`);
          
          // Check transcription status
          const statusResponse = await fetch(`/api/transcription/status/${predictionId}`);
          const statusData = await statusResponse.json();
          
          console.log('📊 Status response:', statusData);
          
          if (statusData.success && statusData.data) {
            const status = statusData.data.status;
            console.log(`📈 Current status: ${status}`);
            
            if (status === 'completed') {
              console.log('✅ Transcription completed!');
              setUploadProgress({
                file,
                progress: 100,
                status: 'completed'
              });
              
              // Get updated material
              const materialResponse = await materialsApi.getById(material.id);
              if (materialResponse.success && materialResponse.data) {
                onUploadComplete?.(materialResponse.data);
              }
              return;
            } else if (status === 'failed' || status === 'error') {
              throw new Error('Transcription failed');
            } else {
              console.log(`⏳ Status: ${status}, waiting...`);
            }
          } else {
            console.log('❌ Invalid status response:', statusData);
          }
        } catch (err) {
          console.error('❌ Error checking status:', err);
        }

        // Wait 5 seconds before next attempt
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      throw new Error('Transcription timeout');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setUploadProgress({
        file,
        progress: 0,
        status: 'error',
        error: errorMessage
      });
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const getStatusIcon = () => {
    if (uploadProgress?.status === 'error') return <AlertCircle className="w-5 h-5 text-error-500" />;
    if (uploadProgress?.status === 'completed') return <CheckCircle className="w-5 h-5 text-success-500" />;
    if (uploadProgress?.status === 'transcribing') return <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />;
    if (uploadProgress?.status === 'uploading') return <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />;
    return <FileAudio className="w-5 h-5 text-gray-400" />;
  };

  const getStatusText = () => {
    if (uploadProgress?.status === 'error') return 'Error occurred';
    if (uploadProgress?.status === 'completed') return 'Upload and transcription completed';
    if (uploadProgress?.status === 'transcribing') return 'Processing transcription...';
    if (uploadProgress?.status === 'uploading') return 'Uploading file...';
    return 'Drop audio file here or click to browse';
  };

  if (uploadProgress) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="rounded-lg p-6">
          <div className="flex items-center justify-center mb-4">
            {getStatusIcon()}
          </div>
          
          <div className="text-center mb-4">
            <h3 className="text-lg font-medium text-base-content mb-2">
              {material.title}
            </h3>
            <p className="text-sm text-base-content/70">{getStatusText()}</p>
          </div>

          {uploadProgress.status !== 'completed' && uploadProgress.status !== 'error' && (
            <div className="w-full bg-base-200 rounded-full h-2 mb-4">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress.progress}%` }}
              />
            </div>
          )}

          {uploadProgress.error && (
            <div className="bg-error/10 border border-error rounded-md p-3 mb-4">
              <p className="text-sm text-error">{uploadProgress.error}</p>
            </div>
          )}

          <div className="flex justify-center space-x-3">
            {onCancel && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={onCancel}
              >
                Cancel
              </button>
            )}
            {uploadProgress.status === 'completed' && (
              <button
                type="submit"
                className="btn btn-primary"
                onClick={() => onUploadComplete?.(material)}
              >
                Continue
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className={`relative rounded-lg p-6 transition-colors`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <h2 className="text-xl font-semibold text-base-content mb-6">Upload Audio File</h2>
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileInput}
          className="file-input file-input-bordered w-full"
        />
        
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-base-content/40 mb-4" />
          <p className="text-sm text-base-content/70 mb-4">
            Drop your audio file here or click to browse
          </p>
          <p className="text-xs text-base-content/60 mb-4">
            Supported formats: MP3, WAV, M4A, FLAC, OGG (max 50MB)
          </p>
          
          <div className="bg-base-200 rounded-md p-3 text-left">
            <p className="text-sm font-medium text-base-content">Material: {material.title}</p>
            <p className="text-xs text-base-content/70">
              {material.language} → {material.targetLanguage.join(', ')}
            </p>
          </div>
        </div>

        {uploadProgress && uploadProgress.status !== 'completed' && uploadProgress.status !== 'error' && (
          <progress className="progress progress-primary w-full mt-2" value={uploadProgress.progress} max="100"></progress>
        )}

        {uploadProgress && uploadProgress.error && (
          <div className="alert alert-error mt-4">
            <span>{uploadProgress.error}</span>
          </div>
        )}
      </div>
    </div>
  );
}; 