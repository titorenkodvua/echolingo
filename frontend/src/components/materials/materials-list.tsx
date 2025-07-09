import React from 'react';
import type { Material } from '../../types';
import { Button } from '../ui';
import { Edit3, Trash2 } from 'lucide-react';
import { LoadingSpinner } from '../ui';
import { formatDuration } from '../../lib/utils';

interface MaterialsListProps {
  materials: Material[];
  loading?: boolean;
  onEdit?: (material: Material) => void;
  onDelete?: (material: Material) => void;
  className?: string;
}

export const MaterialsList: React.FC<MaterialsListProps> = ({ materials, loading, onEdit, onDelete, className }) => {
  if (loading) {
    return <LoadingSpinner center text="Loading materials..." />;
  }

  const getStatusBadge = (status: Material['status']) => {
    switch (status) {
      case 'draft':
        return <span className="badge badge-secondary badge-soft w-20 text-center">Draft</span>;
      case 'processing':
        return <span className="badge badge-warning badge-soft w-20 text-center">Processing</span>;
      case 'ready':
        return <span className="badge badge-info badge-soft w-20 text-center">Ready</span>;
      case 'published':
        return <span className="badge badge-success badge-soft w-20 text-center">Published</span>;
      default:
        return <span className="badge badge-ghost badge-soft w-20 text-center">{status}</span>;
    }
  };

  return (
    <div className={className ? className : ''}>
      <div className="overflow-x-auto rounded-lg shadow bg-base-100 max-w-5xl mx-auto">
        <table className="table table-fixed w-full min-w-[800px]">
          <thead className="bg-neutral text-neutral-content">
            <tr>
              <th className="w-2/5 max-w-lg min-w-[180px] break-words">Title</th>
              <th className="w-32 text-center">Status</th>
              <th className="w-24">Language</th>
              <th className="w-32 whitespace-normal">Translation Languages</th>
              <th className="w-20">Level</th>
              <th className="w-24 text-right">Duration</th>
              <th className="w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(!materials || materials.length === 0) ? (
              <tr>
                <td colSpan={7} className="text-center text-base-content/60 py-8">
                  No materials found.<br />
                  <span className="text-sm text-base-content/40 mt-2 block">Create your first material to get started.</span>
                </td>
              </tr>
            ) : (
              materials.map((material) => (
                <tr key={material.id} className="transition-all duration-500">
                  <td className="font-medium text-base-content max-w-lg min-w-[180px] truncate break-words">{material.title}</td>
                  <td className="text-center">
                    <div className="flex justify-center">
                      {getStatusBadge(material.status)}
                    </div>
                  </td>
                  <td>{material.language}</td>
                  <td className="whitespace-normal break-words text-xs">{material.targetLanguage.join(', ')}</td>
                  <td>{material.difficultyLevel}</td>
                  <td className="text-right">{material.duration ? formatDuration(material.duration) : 'N/A'}</td>
                  <td className="flex gap-2 justify-end text-right">
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
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 