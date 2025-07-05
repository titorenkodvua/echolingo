import React from 'react';
import type { Transcription } from '../types';

interface SegmentedTranscriptionViewProps {
  transcription: Transcription;
}

// Цвета для разных спикеров (с поддержкой dark mode)
const speakerBgColors = [
  'bg-blue-50 dark:bg-blue-900',   // speaker 0
  'bg-green-50 dark:bg-green-900', // speaker 1
  'bg-yellow-50 dark:bg-yellow-900', // speaker 2
  'bg-purple-50 dark:bg-purple-900', // speaker 3
  'bg-pink-50 dark:bg-pink-900',   // speaker 4
];

export const SegmentedTranscriptionView: React.FC<SegmentedTranscriptionViewProps> = ({ transcription }) => {
  // Собираем все utterances в один массив
  const allUtterances = transcription.sentences?.flatMap(s => s.utterances) || [];

  // Группируем utterances в сегменты по is_segment_start
  const segments: { id: string; utterances: string[]; speaker: number }[] = [];
  let currentSegment: { id: string; utterances: string[]; speaker: number } | null = null;
  allUtterances.forEach(utt => {
    if (utt.is_segment_start || !currentSegment) {
      currentSegment = { id: utt.id, utterances: [], speaker: utt.speaker };
      segments.push(currentSegment);
    }
    currentSegment.utterances.push(utt.text);
  });

  return (
    <div className="space-y-4 mt-6">
      {segments.map((segment, i) => {
        const bgColor = speakerBgColors[segment.speaker % speakerBgColors.length] || 'bg-base-100';
        return (
          <div
            key={segment.id}
            className={`card card-bordered shadow-sm ${bgColor}`}
          >
            <div className="card-body p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`badge badge-outline badge-lg`}>Speaker {segment.speaker + 1}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {segment.utterances.map((utt, idx) => (
                  <span
                    key={idx}
                    className="badge badge-neutral badge-lg transition-colors duration-150 cursor-pointer hover:bg-yellow-200 dark:hover:bg-yellow-700"
                  >
                    {utt}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}; 