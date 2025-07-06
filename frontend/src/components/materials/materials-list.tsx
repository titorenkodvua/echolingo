import React from 'react';
import type { Material } from '../../types';
import { MaterialCard } from './material-card';
import { LoadingSpinner } from '../ui';

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
  if (!materials || materials.length === 0) {
    return (
      <div className="text-center py-8 text-base-content/60">
        <p>No materials found.</p>
        <p className="text-sm text-base-content/40 mt-2">Create your first material to get started.</p>
      </div>
    );
  }
  return (
    <div className={className ? className : 'flex flex-col gap-8'}>
      {materials.map((material, i) => (
        <div
          key={material.id}
          className={`transition-all duration-500 ${'opacity-100 translate-y-0'}`}
          style={{ transitionDelay: `${i * 80}ms` }}
        >
          <MaterialCard
            material={material}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      ))}
    </div>
  );
}; 