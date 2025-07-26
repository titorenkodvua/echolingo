import React from 'react';
import { X } from 'lucide-react';
import { CreateMaterialForm } from '../CreateMaterialForm';
import type { Material } from '../../types';

interface CreateMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDraftCreated?: (material: Material, shouldNavigateToEdit?: boolean) => void;
}

export const CreateMaterialModal: React.FC<CreateMaterialModalProps> = ({
  isOpen,
  onClose,
  onDraftCreated
}) => {
  const [key, setKey] = React.useState(0);

  const handleClose = () => {
    // ✅ Сбрасываем форму при закрытии, изменяя key
    setKey(prev => prev + 1);
    onClose();
  };

  // ✅ Обработка клавиши Escape
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleDraftCreated = (material: Material, shouldNavigateToEdit = false) => {
    onDraftCreated?.(material, shouldNavigateToEdit);
    handleClose();
  };

  return (
    <div className={`modal ${isOpen ? 'modal-open' : ''}`}>
      <div className="modal-box max-w-lg w-full relative">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal content */}
        <div className="py-2">
          <CreateMaterialForm
            key={key}
            onDraftCreated={handleDraftCreated}
            onCancel={handleClose}
          />
        </div>
      </div>
      
      {/* Modal backdrop */}
      <div className="modal-backdrop" onClick={handleClose}>
        <button>close</button>
      </div>
    </div>
  );
}; 