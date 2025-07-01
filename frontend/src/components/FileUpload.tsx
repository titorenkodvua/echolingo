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
        <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-6">
          <div className="flex items-center justify-center mb-4">
            {getStatusIcon()}
          </div>
          
          <div className="text-center mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {uploadProgress.file.name}
            </h3>
            <p className="text-sm text-gray-600">{getStatusText()}</p>
          </div>

          {uploadProgress.status !== 'completed' && (
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress.progress}%` }}
              />
            </div>
          )}

          {error && (
            <div className="bg-error-50 border border-error-200 rounded-md p-3 mb-4">
              <p className="text-sm text-error-700">{error}</p>
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <X className="w-4 h-4 mr-2" />
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
        className={`relative bg-white rounded-lg border-2 border-dashed p-6 transition-colors ${
          dragActive 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-300 hover:border-gray-400'
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
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isProcessing}
        />
        
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Upload Audio File
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Drop your audio file here or click to browse
          </p>
          <p className="text-xs text-gray-500">
            Supported formats: MP3, WAV, M4A, FLAC, OGG (max 50MB)
          </p>
        </div>
      </div>
    </div>
  );
}; 