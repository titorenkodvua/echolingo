export interface Transcription {
  id: string;
  originalFileName: string;
  gladiaId: string;
  status: 'submitted' | 'processing' | 'completed' | 'failed';
  duration: number | null;
  full_transcript: string;
  sentences: Sentence[];
  translation: Translation[];
  count_of_speakers: number;
  summary: string | null;
  metadata: any;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Sentence {
  id: string;
  text: string;
  start: number;
  end: number;
  speaker: number;
  confidence: number;
  utterances: Utterance[];
}

export interface Translation {
  language: string;
  text: string;
  confidence: number;
}

export interface Material {
  id: string;
  title: string;
  description: string;
  audioFileName: string | null;
  transcriptionId: string | null;
  userId: string;
  tags: string[];
  isPublic: boolean;
  difficultyLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  language: string;
  targetLanguage: string[];
  duration: number | null;
  estimatedTime: number | null;
  averageRating: number | null;
  ratingCount: number;
  category: string | null;
  author: string | null;
  recommendedRepetitions: number;
  status: 'draft' | 'processing' | 'ready' | 'published' | 'failed';
  playCount: number;
  lastPlayed: string | null;
  createdAt: string;
  updatedAt: string;
  transcription?: Transcription;
}

export interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'transcribing' | 'completed' | 'error';
  transcriptionId?: string;
  error?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface MaterialsListResponse {
  materials: Material[];
  total: number;
  limit: number;
  offset: number;
}

export interface Utterance {
  id: string;
  is_segment_start: boolean;
  speaker: number;
  text: string;
  start: number;
  end: number;
  confidence: number;
  translation?: Translation[];
} 