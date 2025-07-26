import React, { useState, useCallback, useRef } from 'react';
import type { Transcription, Translation } from '../types';
import { TranslationTooltip } from './ui/translation-tooltip';

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
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [tooltipTranslations, setTooltipTranslations] = useState<Translation[]>([]);
  
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Собираем все utterances в один массив
  const allUtterances = transcription.sentences?.flatMap(s => s.utterances) || [];

  // Функция для получения переводов конкретного utterance
  const getUtteranceTranslations = useCallback((utteranceId: string): Translation[] => {
    const utterance = allUtterances.find(utt => utt.id === utteranceId);
    if (utterance?.translation) {
      return utterance.translation;
    }
    
    // Если нет переводов на уровне utterance, используем общие переводы транскрипции
    return transcription.translation || [];
  }, [allUtterances, transcription.translation]);

  // Обработчик наведения на utterance
  const handleUtteranceHover = useCallback((event: React.MouseEvent, segmentId: string, utteranceId: string) => {
    const translations = getUtteranceTranslations(utteranceId);
    
    // Очищаем предыдущий таймаут
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    
    setHoveredSegmentId(segmentId);
    setHoveredUtteranceId(utteranceId);
    
    if (translations.length > 0) {
      setTooltipPosition({ x: event.clientX, y: event.clientY });
      setTooltipTranslations(translations);
      
      // Показываем tooltip с задержкой
      tooltipTimeoutRef.current = setTimeout(() => {
        setIsTooltipVisible(true);
      }, 300);
    }
  }, [getUtteranceTranslations]);

  // Обработчик ухода мыши с utterance
  const handleUtteranceLeave = useCallback(() => {
    // Очищаем таймаут
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
    
    setIsTooltipVisible(false);
    setHoveredSegmentId(null);
    setHoveredUtteranceId(null);
  }, []);

  // Очистка таймаута при размонтировании
  React.useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

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
    <div className="relative">
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
                  const hasTranslations = getUtteranceTranslations(utt.uttId).length > 0;
                  
                  return (
                    <span 
                      key={utt.uttId}
                      className={`transition-colors duration-200 py-0.5 -my-0.5 ${
                        hasTranslations ? 'cursor-pointer' : 'cursor-default'
                      } ${
                        isUtteranceHovered
                          ? 'bg-primary/60 text-primary-content'
                          : isSegmentHighlighted
                          ? 'bg-primary/30 text-primary-content'
                          : hasTranslations
                          ? 'hover:bg-base-200'
                          : ''
                      }`}
                      onMouseEnter={(e) => handleUtteranceHover(e, utt.segmentId, utt.uttId)}
                      onMouseLeave={handleUtteranceLeave}
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
      
      {/* Tooltip с переводами */}
      <TranslationTooltip
        translations={tooltipTranslations}
        isVisible={isTooltipVisible}
        position={tooltipPosition}
        onClose={() => setIsTooltipVisible(false)}
      />
    </div>
  );
}; 