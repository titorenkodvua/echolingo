import React, { useState } from 'react';
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
  const [hoveredSegmentId, setHoveredSegmentId] = useState<string | null>(null);
  const [hoveredUtteranceId, setHoveredUtteranceId] = useState<string | null>(null);
  
  // Собираем все utterances в один массив
  const allUtterances = transcription.sentences?.flatMap(s => s.utterances) || [];

  // Группируем utterances в реплики по спикерам, сохраняя сегменты
  const replicas: { 
    id: string; 
    utterances: { text: string; isSegmentStart: boolean; segmentId: string; uttId: string }[]; 
    speaker: number 
  }[] = [];
  let currentReplica: { 
    id: string; 
    utterances: { text: string; isSegmentStart: boolean; segmentId: string; uttId: string }[]; 
    speaker: number 
  } | null = null;
  
  let currentSegmentId = '';
  
  allUtterances.forEach(utt => {
    // Начинаем новую реплику если спикер сменился или это первый utterance
    if (!currentReplica || currentReplica.speaker !== utt.speaker) {
      currentReplica = { id: utt.id, utterances: [], speaker: utt.speaker };
      replicas.push(currentReplica);
    }
    
    // Обновляем ID сегмента если начался новый сегмент
    if (utt.is_segment_start) {
      currentSegmentId = utt.id;
    }
    
    currentReplica.utterances.push({ 
      text: utt.text, 
      isSegmentStart: utt.is_segment_start, 
      segmentId: currentSegmentId,
      uttId: utt.id
    });
  });

  return (
    <div>
      {replicas.map((replica, i) => {
        const speakerColor = speakerColors[replica.speaker % speakerColors.length];
        
        return (
          <div
            key={replica.id}
            className="chat chat-start"
          >
            {/* Аватар - кружочек с номером спикера */}
            <div className="chat-image avatar">
              <div className={`w-8 h-8 rounded-full ${speakerColor} flex items-center justify-center text-center`}>
                <span className="text-base-100 font-bold text-xl leading-none w-full h-full flex items-center justify-center">
                  {replica.speaker + 1}
                </span>
              </div>
            </div>
            
            {/* Сообщение - вся реплика спикера */}
            <div className="chat-bubble bg-base-100 max-w-lg py-4">
              <div>
                {replica.utterances.map((utt, idx) => {
                  const isSegmentHighlighted = hoveredSegmentId === utt.segmentId;
                  const isUtteranceHovered = hoveredUtteranceId === utt.uttId;
                  
                  return (
                    <span 
                      key={utt.uttId}
                      className={`transition-colors duration-200 cursor-pointer rounded-sm ${
                        isUtteranceHovered
                          ? 'bg-primary/60 text-primary-content'
                          : isSegmentHighlighted
                          ? 'bg-primary/30 text-primary-content'
                          : 'hover:bg-base-200'
                      }`}
                      onMouseEnter={() => {
                        setHoveredSegmentId(utt.segmentId);
                        setHoveredUtteranceId(utt.uttId);
                      }}
                      onMouseLeave={() => {
                        setHoveredSegmentId(null);
                        setHoveredUtteranceId(null);
                      }}
                    >
                      {utt.isSegmentStart && idx > 0 ? ' ' : ''}
                      {utt.text}
                      {idx < replica.utterances.length - 1 ? ' ' : ''}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}; 