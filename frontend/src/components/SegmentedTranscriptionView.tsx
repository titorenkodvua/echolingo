import React from 'react';
import type { Transcription } from '../types';

interface SegmentedTranscriptionViewProps {
  transcription: Transcription;
}

// Пастельные цвета для кружочков спикеров
const speakerColors = [
  'bg-blue-300',    // speaker 0
  'bg-green-300',   // speaker 1
  'bg-yellow-300',  // speaker 2
  'bg-purple-300',  // speaker 3
  'bg-pink-300',    // speaker 4
  'bg-red-300',     // speaker 5
  'bg-indigo-300',  // speaker 6
  'bg-orange-300',  // speaker 7
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
    <div>
      {segments.map((segment, i) => {
        const speakerColor = speakerColors[segment.speaker % speakerColors.length];
        
        return (
          <div
            key={segment.id}
            className="chat chat-start"
          >
            {/* Аватар - кружочек с номером спикера */}
            <div className="chat-image avatar">
              <div className={`w-10 h-10 rounded-full ${speakerColor} flex items-center justify-center text-center`}>
                <span className="text-base-100 font-bold text-2xl leading-none w-full h-full flex items-center justify-center">
                  {segment.speaker + 1}
                </span>
              </div>
            </div>
            
            {/* Сообщение */}
            <div className="chat-bubble bg-base-100 max-w-lg py-4">
              <div>
                {segment.utterances.map((utt, idx) => (
                  <span key={idx}>
                    {utt}
                    {idx < segment.utterances.length - 1 ? ' ' : ''}
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