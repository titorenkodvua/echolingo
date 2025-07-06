import React, { useState } from 'react';
import { Plus, RotateCcw } from 'lucide-react';
import { MaterialsList } from '../components/materials';
import { useMaterials, useDeleteMaterial } from '../hooks/api';
import { Button } from '../components/ui';
import { useToast } from '../providers/toast-provider';
import { useNavigate } from 'react-router-dom';
import { DraftForm } from '../components/DraftForm';

export const HomePage: React.FC = () => {
  const { data, isLoading, error, refetch } = useMaterials();
  const deleteMaterial = useDeleteMaterial();
  const toast = useToast();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);

  React.useEffect(() => {
    if (error) toast.error(error.message);
  }, [error, toast]);

  const publishedMaterials = data?.materials?.filter(m => m.status !== 'draft') || [];

  const handleEdit = (material) => {
    navigate(`/materials/${material.id}/edit`);
  };

  const handleDelete = (material) => {
    if (window.confirm(`Delete material "${material.title}"? Это действие необратимо.`)) {
      deleteMaterial.mutate(material.id);
    }
  };

  const handleDraftCreated = (material) => {
    setShowCreateModal(false);
    navigate(`/materials/${material.id}/edit`);
  };

  return (
    <div className="min-h-screen bg-base-200 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img
              src="/echolingo_logo.png"
              alt="EchoLingo Logo"
              className="mr-3"
              style={{ height: 48 }}
            />
            <h1 className="text-4xl font-bold text-base-content font-montserrat m-0 p-0">
              EchoLingo
            </h1>
          </div>
          <p className="text-lg text-base-content/70">
            Create language learning materials with automatic transcription
          </p>
        </div>
        {/* Published Materials */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-base-content">
              Published Materials
            </h2>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="primary"
                aria-label="Создать материал"
                onClick={() => setShowCreateModal(true)}
                icon={<Plus className="w-5 h-5" />}
                noIconMargin
              >
                <span className="sr-only">Add</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => refetch()}
                disabled={isLoading}
                aria-label="Обновить"
                loading={isLoading}
                icon={<RotateCcw className="w-5 h-5" />}
              />
            </div>
          </div>
          <MaterialsList
            materials={publishedMaterials}
            loading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>
      {/* Модальное окно для создания материала */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-base-100 rounded-lg shadow-lg max-w-md w-full relative animate-fade-in">
            <DraftForm
              onDraftCreated={handleDraftCreated}
              onCancel={() => setShowCreateModal(false)}
            />
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-base-content/40 hover:text-base-content text-2xl font-bold focus:outline-none"
              title="Close"
              aria-label="Закрыть"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 