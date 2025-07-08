import React from 'react';
import type { Material } from '../../types';
import { Button } from '../ui';
import { Edit3, Trash2 } from 'lucide-react';
import { cn, formatDuration } from '../../lib/utils';

interface MaterialCardProps {
  material: Material;
  onEdit?: (material: Material) => void;
  onDelete?: (material: Material) => void;
  className?: string;
}

export const MaterialCard: React.FC<MaterialCardProps> = ({ material, onEdit, onDelete, className }) => {
  return (
    <div
      className={cn(
        'bg-base-100 rounded-3xl shadow-[0_6px_32px_0_rgba(0,0,0,0.04)] p-8 transition-all duration-500 hover:shadow-[0_12px_48px_0_rgba(0,0,0,0.07)]',
        className
      )}
      tabIndex={0}
      aria-label={`Material: ${material.title}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-base-content mb-1">
            {material.title}
          </h3>
          <p className="text-sm text-base-content/70 mb-2">
            {material.transcription?.full_transcript?.substring(0, 300) || '—'}
          </p>
          <div className="flex items-center space-x-4 text-xs text-base-content/60">
            <span>Level: {material.difficultyLevel}</span>
            <span>Duration: {material.duration ? formatDuration(material.duration) : 'N/A'}</span>
            <span>Language: {material.language} → {material.targetLanguage.join(', ')}</span>
          </div>
          {material.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {material.tags.map((tag, index) => (
                <span
                  key={index}
                  className="badge badge-primary badge-outline"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="text-right text-xs text-base-content/60">
          <div>Created: {new Date(material.createdAt).toLocaleDateString()}</div>
          <div>Plays: {material.playCount}</div>
          <div className="flex flex-row justify-end items-center gap-2 mt-2">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                icon={<Edit3 className="w-5 h-5" />}
                aria-label="Edit"
                onClick={() => onEdit(material)}
                className="btn-square"
              />
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                icon={<Trash2 className="w-4 h-4" />}
                aria-label="Delete"
                onClick={() => onDelete(material)}
                className="btn-square"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 