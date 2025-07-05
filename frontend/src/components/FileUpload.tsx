import React, { useCallback, useState } from 'react';
import { Upload, FileAudio, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useTranscription } from '../hooks/useTranscription';
import type { Transcription } from '../types';

interface FileUploadProps {
  onTranscriptionComplete?: (transcription: Transcription) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onTranscriptionComplete }) => {
  const [dragActive, setDragActive] = useState(false);
  const { uploadProgress, isProcessing, error, startTranscription, reset } = useTranscription();

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
    // Validate file type by MIME type and extension
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
      const result = await startTranscription(file, 'en');
      if (onTranscriptionComplete && result) {
        onTranscriptionComplete(result);
      }
    } catch (err) {
      console.error('Transcription failed:', err);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const getStatusIcon = () => {
    if (error) return <AlertCircle className="w-5 h-5 text-error-500" />;
    if (uploadProgress?.status === 'completed') return <CheckCircle className="w-5 h-5 text-success-500" />;
    if (isProcessing) return <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />;
    return <FileAudio className="w-5 h-5 text-gray-400" />;
  };

  const getStatusText = () => {
    if (error) return 'Error occurred';
    if (uploadProgress?.status === 'completed') return 'Transcription completed';
    if (uploadProgress?.status === 'transcribing') return 'Processing transcription...';
    if (uploadProgress?.status === 'uploading') return 'Uploading file...';
    return 'Drop audio file here or click to browse';
  };

  if (uploadProgress) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-base-100 rounded-lg border-2 border-dashed border-base-300 p-6">
          <div className="flex items-center justify-center mb-4">
            {getStatusIcon()}
          </div>
          
          <div className="text-center mb-4">
            <h3 className="text-lg font-medium text-base-content mb-2">
              {uploadProgress.file.name}
            </h3>
            <p className="text-sm text-base-content/70">{getStatusText()}</p>
          </div>

          {uploadProgress.status !== 'completed' && (
            <div className="w-full bg-base-200 rounded-full h-2 mb-4">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress.progress}%` }}
              />
            </div>
          )}

          {error && (
            <div className="bg-error/10 border border-error rounded-md p-3 mb-4">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          <div className="flex justify-center">
            <button
              type="button"
              className="btn btn-outline"
              onClick={reset}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className={`relative bg-base-100 rounded-lg border-2 border-dashed p-6 transition-colors ${
          dragActive 
            ? 'border-primary bg-primary/10' 
            : 'border-base-300 hover:border-base-300'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileInput}
          className="file-input file-input-bordered w-full"
        />
        
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-base-content/40 mb-4" />
          <h3 className="text-lg font-medium text-base-content mb-2">
            Upload Audio File
          </h3>
          <p className="text-sm text-base-content/70 mb-4">
            Drop your audio file here or click to browse
          </p>
          <p className="text-xs text-base-content/60">
            Supported formats: MP3, WAV, M4A, FLAC, OGG (max 50MB)
          </p>
        </div>
      </div>
    </div>
  );
}; 