import React, { useState } from 'react';
import { Plus, RotateCcw } from 'lucide-react';
import { MaterialsList } from '../components/materials';
import { useMaterials, useDeleteMaterial } from '../hooks/api';
import { Button, CreateMaterialModal } from '../components/ui';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { useToast } from '../providers/toast-provider';
import { useNavigate } from 'react-router-dom';
import type { Material } from '../types';

// ThemeController — DaisyUI theme switcher (absolute top-right, новые иконки)
const ThemeController: React.FC = () => {
  const [theme, setTheme] = React.useState(() =>
    typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') || 'el-light' : 'el-light'
  );

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  React.useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved && saved !== theme) setTheme(saved);
  }, []);

  return (
    <div className="absolute top-4 right-4 z-50">
      <label className="swap swap-rotate">
        <input
          type="checkbox"
          className="theme-controller"
          checked={theme === 'dark'}
          onChange={() => setTheme(theme === 'dark' ? 'el-light' : 'dark')}
          aria-checked={theme === 'dark'}
        />
        {/* sun icon */}
        <svg
          className="swap-off h-10 w-10 fill-current"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
        >
          <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
        </svg>
        {/* moon icon */}
        <svg
          className="swap-on h-10 w-10 fill-current"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
        >
          <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
        </svg>
      </label>
    </div>
  );
};

export const HomePage: React.FC = () => {
  const { data, isLoading, error, refetch } = useMaterials();
  const deleteMaterial = useDeleteMaterial();
  const toast = useToast();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    material: Material | null;
  }>({
    isOpen: false,
    material: null
  });

  React.useEffect(() => {
    if (error) toast.error(error.message);
  }, [error, toast]);

  const publishedMaterials = data?.materials || [];  // ✅ Показываем все материалы

  const handleEdit = (material: Material) => {
    navigate(`/materials/${material.id}/edit`);
  };

  const handleDelete = (material: Material) => {
    setDeleteDialog({
      isOpen: true,
      material
    });
  };

  const confirmDelete = () => {
    if (deleteDialog.material) {
      deleteMaterial.mutate(deleteDialog.material.id, {
        onSuccess: () => {
          setDeleteDialog({ isOpen: false, material: null });
        },
        onError: () => {
          setDeleteDialog({ isOpen: false, material: null });
        }
      });
    }
  };

  const cancelDelete = () => {
    setDeleteDialog({ isOpen: false, material: null });
  };

  const handleMaterialCreated = (material: Material, shouldNavigateToEdit = false) => {
    setShowCreateModal(false);
    
    // Только если явно указано - переходим к редактированию  
    if (shouldNavigateToEdit) {
      navigate(`/materials/${material.id}/edit`);
    }
    
    // Всегда обновляем список материалов
    refetch();
  };

  return (
    <div className="min-h-screen bg-base-200 py-8">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-5xl mx-auto">
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
          <ThemeController />
            <p className="text-lg text-base-content/70">
            Create language learning materials with automatic transcription
          </p>
        </div>
          {/* All Materials */}
          <div>
            <div className="flex justify-between items-center mb-4 px-2">
              <h2 className="text-xl font-semibold text-base-content">
                All Materials
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="accent"
                  aria-label="Create material"
                  onClick={() => setShowCreateModal(true)}
                  icon={<Plus className="w-5 h-5" />}
                  noIconMargin
                  title="Add material"
                >
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => refetch()}
                  disabled={isLoading}
                  aria-label="Refresh"
                  loading={isLoading}
                  icon={<RotateCcw className="w-5 h-5" />}
                  title="Refresh materials list"
                >
                  Refresh
                </Button>
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
      </div>

      {/* Create Material Modal */}
      <CreateMaterialModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onMaterialCreated={handleMaterialCreated}
      />

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Material"
        message={`Are you sure you want to delete "${deleteDialog.material?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isLoading={deleteMaterial.isPending}
        variant="danger"
      />
    </div>
  );
}; 