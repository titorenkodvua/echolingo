import React, { useState, useEffect } from 'react';
import { Plus, FileText, Upload, Edit3, Trash2, CheckCircle, RotateCcw } from 'lucide-react';
import { DraftForm } from '../components/DraftForm';
import { MaterialUpload } from '../components/MaterialUpload';
import { MaterialEdit } from '../components/MaterialPublish';
import { materialsApi } from '../utils/api';
import type { Material, Transcription } from '../types';
import { Link, useNavigate, useLocation } from 'react-router-dom';

type PipelineStep = 'draft' | 'upload' | 'edit';

interface PipelineState {
  step: PipelineStep;
  material?: Material;
  transcription?: Transcription;
}

// Хук для определения текущей темы
function useTheme(): 'light' | 'dark' {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof document !== 'undefined') {
      return (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const t = document.documentElement.getAttribute('data-theme');
      if (t === 'dark' || t === 'light') setTheme(t);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  return theme;
}

export const HomePage: React.FC = () => {
  const [pipeline, setPipeline] = useState<PipelineState | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [visibleMaterials, setVisibleMaterials] = useState<boolean[]>([]);
  const [drafts, setDrafts] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Load materials and drafts
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [materialsResponse, draftsResponse] = await Promise.all([
        materialsApi.getAll(),
        materialsApi.getDrafts()
      ]);

      if (materialsResponse.success && materialsResponse.data) {
        const mats = Array.isArray(materialsResponse.data.materials) ? materialsResponse.data.materials : [];
        setMaterials(mats);
        setVisibleMaterials([]);
        setTimeout(() => {
          const arr = new Array(mats.length).fill(false);
          setVisibleMaterials(arr);
          mats.forEach((_, i) => {
            setTimeout(() => {
              setVisibleMaterials(prev => {
                const next = [...prev];
                next[i] = true;
                return next;
              });
            }, i * 100);
          });
        }, 200);
      }

      if (draftsResponse.success && draftsResponse.data) {
        setDrafts(draftsResponse.data);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (materials.length > 0) {
      setVisibleMaterials([]);
      setTimeout(() => {
        const arr = new Array(materials.length).fill(false);
        setVisibleMaterials(arr);
        materials.forEach((_, i) => {
          setTimeout(() => {
            setVisibleMaterials(prev => {
              const next = [...prev];
              next[i] = true;
              return next;
            });
          }, i * 100);
        });
      }, 200);
    }
  }, [materials]);

  useEffect(() => {
    if (pipeline && pipeline.step === 'edit') {
      setIsModalOpen(true);
      setShowModal(false);
      setTimeout(() => setShowModal(true), 0);
      document.body.classList.add('overflow-hidden');
    } else {
      setShowModal(false);
      setTimeout(() => setIsModalOpen(false), 250); // Fade Out
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [pipeline]);

  useEffect(() => {
    if (pipeline && pipeline.step === 'upload') {
      setIsUploadModalOpen(true);
      setShowUploadModal(false);
      setTimeout(() => setShowUploadModal(true), 0);
      document.body.classList.add('overflow-hidden');
    } else {
      setShowUploadModal(false);
      setTimeout(() => setIsUploadModalOpen(false), 250);
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [pipeline]);

  useEffect(() => {
    if (showCreateForm) {
      setIsDraftModalOpen(true);
      setShowDraftModal(false);
      setTimeout(() => setShowDraftModal(true), 0);
      document.body.classList.add('overflow-hidden');
    } else {
      setShowDraftModal(false);
      setTimeout(() => setIsDraftModalOpen(false), 250);
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [showCreateForm]);

  // Pipeline handlers
  const handleDraftCreated = (material: Material) => {
    setDrafts(prev => [material, ...prev]);
    setShowCreateForm(false);
    setPipeline({ step: 'upload', material });
  };

  const handleUploadComplete = async (material: Material) => {
    navigate(`/materials/${material.id}/edit?back=${encodeURIComponent(location.pathname)}`);
  };

  const handlePublished = async (material: Material) => {
    setPipeline(null);
    setDrafts(prev => prev.filter(d => d.id !== material.id));
    await loadData();
  };

  const handleCancelPipeline = () => {
    setPipeline(null);
  };

  const handleContinueDraft = (material: Material) => {
    setPipeline({ step: 'edit', material });
  };

  const handleDeleteDraft = async (materialId: string) => {
    try {
      await materialsApi.delete(materialId);
      setDrafts(prev => prev.filter(d => d.id !== materialId));
    } catch (err) {
      console.error('Failed to delete draft:', err);
    }
  };

  const handleDeleteMaterial = async () => {
    if (!materialToDelete) return;
    try {
      await materialsApi.delete(materialToDelete.id);
      setMaterials(prev => prev.filter(m => m.id !== materialToDelete.id));
      setShowDeleteModal(false);
      setMaterialToDelete(null);
    } catch (err) {
      alert('Failed to delete material');
    }
  };

  const getStatusBadge = (status: Material['status']) => {
    const statusConfig = {
      draft: { color: 'badge badge-outline', label: 'Draft' },
      processing: { color: 'badge badge-warning', label: 'Processing' },
      ready: { color: 'badge badge-success', label: 'Ready' },
      published: { color: 'badge badge-primary', label: 'Published' },
      failed: { color: 'badge badge-error', label: 'Failed' }
    };

    const config = statusConfig[status];
    return (
      <span className={`${config.color}`}>{config.label}</span>
    );
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setTimeout(() => {
      setIsModalOpen(false);
      handleCancelPipeline();
    }, 250); // Длительность анимации
  };

  const handleCloseUploadModal = () => {
    setShowUploadModal(false);
    setTimeout(() => {
      setIsUploadModalOpen(false);
      handleCancelPipeline();
    }, 250);
  };

  // Фильтруем опубликованные материалы (draft не показываем)
  const publishedMaterials = materials.filter(m => m.status !== 'draft');

  return (
    <div className="min-h-screen bg-base-200 py-8">
      <div className={`transition-all duration-300 ${((pipeline && (pipeline.step === 'edit' || pipeline.step === 'upload')) || showCreateForm) ? 'filter blur-md pointer-events-none select-none' : ''}`} id="main-content">
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
                {!pipeline && !showCreateForm && (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="btn btn-primary btn-sm"
                    title="Create New Material"
                    aria-label="Создать материал"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}
              <button
                onClick={loadData}
                disabled={isLoading}
                className="btn btn-ghost btn-sm"
                title="Refresh"
                aria-label="Обновить"
              >
                  {isLoading ? (
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /></svg>
                  ) : (
                    <RotateCcw className="w-5 h-5" />
                  )}
              </button>
              </div>
            </div>

            {publishedMaterials.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-base-content/40 mb-4" />
                <p className="text-base-content/60">No published materials yet.</p>
                <p className="text-sm text-base-content/40 mt-2">
                  Create your first material to get started.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                {publishedMaterials.map((material, i) => (
                  <div
                    key={material.id}
                    className={`bg-base-100 rounded-3xl shadow-[0_6px_32px_0_rgba(0,0,0,0.04)] p-8 transition-all duration-500 hover:shadow-[0_12px_48px_0_rgba(0,0,0,0.07)] ${visibleMaterials[i] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                    style={{ transitionDelay: `${i * 80}ms` }}
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
                          <span>Duration: {material.duration ? `${Math.round(material.duration / 60)}m` : 'N/A'}</span>
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
                          <Link to={`/materials/${material.id}/edit`} title="Редактировать">
                            <button className="btn btn-ghost btn-square btn-sm" aria-label="Редактировать">
                              <Edit3 className="w-5 h-5" />
                            </button>
                          </Link>
                          <button
                            onClick={() => { setMaterialToDelete(material); setShowDeleteModal(true); }}
                            className="btn btn-error btn-square btn-sm"
                            title="Delete"
                            aria-label="Удалить"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Модальные окна рендерим вне размываемого контейнера */}
      {isDraftModalOpen && !pipeline && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${showDraftModal ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className={`bg-base-100 rounded-lg shadow-lg max-w-md w-full relative transform transition-transform duration-300 ${showDraftModal ? 'scale-100' : 'scale-95'} max-h-screen overflow-y-auto`}>
            <DraftForm
              onDraftCreated={(material) => {
                handleDraftCreated(material);
                setShowCreateForm(false);
              }}
              onCancel={() => setShowCreateForm(false)}
            />
            <button
              onClick={() => setShowCreateForm(false)}
              className="absolute top-4 right-4 text-base-content/40 hover:text-base-content text-2xl font-bold focus:outline-none"
              title="Close"
              aria-label="Закрыть"
            >
              ×
            </button>
          </div>
        </div>
      )}
      {/* Upload Audio File Modal */}
      {isUploadModalOpen && pipeline && pipeline.step === 'upload' && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${showUploadModal ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className={`bg-base-100 rounded-lg shadow-lg max-w-md w-full relative transform transition-transform duration-300 ${showUploadModal ? 'scale-100' : 'scale-95'} max-h-screen overflow-y-auto`}>
            <MaterialUpload
              material={pipeline.material!}
              onUploadComplete={handleUploadComplete}
              onCancel={handleCloseUploadModal}
            />
            <button
              onClick={handleCloseUploadModal}
              className="absolute top-4 right-4 text-base-content/40 hover:text-base-content text-2xl font-bold focus:outline-none"
              title="Close"
              aria-label="Закрыть"
            >
              ×
            </button>
          </div>
        </div>
      )}
      {/* Модальное окно подтверждения удаления (DaisyUI Modal) */}
      {showDeleteModal && materialToDelete && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Удалить материал?</h3>
            <p className="py-4">Это действие необратимо. Вы уверены, что хотите удалить материал <span className="font-medium">"{materialToDelete.title}"</span>?</p>
            <div className="modal-action">
              <button
                onClick={() => { setShowDeleteModal(false); setMaterialToDelete(null); }}
                className="btn btn-outline"
              >
                Отмена
              </button>
              <button
                onClick={handleDeleteMaterial}
                className="btn btn-error"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 