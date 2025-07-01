import React, { useState, useEffect } from 'react';
import { Plus, FileText, Upload, Edit3, Trash2, CheckCircle } from 'lucide-react';
import { DraftForm } from '../components/DraftForm';
import { MaterialUpload } from '../components/MaterialUpload';
import { MaterialEdit } from '../components/MaterialPublish';
import { materialsApi } from '../utils/api';
import type { Material, Transcription } from '../types';

type PipelineStep = 'draft' | 'upload' | 'publish' | 'complete' | 'edit';

interface PipelineState {
  step: PipelineStep;
  material?: Material;
  transcription?: Transcription;
}

export const HomePage: React.FC = () => {
  const [pipeline, setPipeline] = useState<PipelineState | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [drafts, setDrafts] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Load materials and drafts
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [materialsResponse, draftsResponse] = await Promise.all([
        materialsApi.getAll(),
        materialsApi.getDrafts()
      ]);

      if (materialsResponse.success && materialsResponse.data) {
        setMaterials(materialsResponse.data.materials || []);
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

  // Pipeline handlers
  const handleDraftCreated = (material: Material) => {
    setPipeline({ step: 'upload', material });
    setDrafts(prev => [material, ...prev]);
  };

  const handleUploadComplete = (material: Material) => {
    setPipeline({ step: 'publish', material });
  };

  const handlePublished = async (material: Material) => {
    setPipeline({ step: 'complete', material });
    try {
      const response = await materialsApi.getById(material.id);
      if (response.success && response.data) {
        setMaterials(prev => prev.map(m => m.id === material.id ? response.data as Material : m));
      } else {
        setMaterials(prev => prev.map(m => m.id === material.id ? material : m));
      }
    } catch {
      setMaterials(prev => prev.map(m => m.id === material.id ? material : m));
    }
    setDrafts(prev => prev.filter(d => d.id !== material.id));
    setTimeout(() => {
      setPipeline(null);
    }, 2000);
  };

  const handleCancelPipeline = () => {
    setPipeline(null);
  };

  const handleContinueDraft = (material: Material) => {
    if (material.status === 'draft') {
      setPipeline({ step: 'upload', material });
    } else if (material.status === 'ready') {
      setPipeline({ step: 'publish', material });
    }
  };

  const handleDeleteDraft = async (materialId: string) => {
    try {
      await materialsApi.delete(materialId);
      setDrafts(prev => prev.filter(d => d.id !== materialId));
    } catch (err) {
      console.error('Failed to delete draft:', err);
    }
  };

  const getStatusBadge = (status: Material['status']) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      processing: { color: 'bg-yellow-100 text-yellow-800', label: 'Processing' },
      ready: { color: 'bg-green-100 text-green-800', label: 'Ready' },
      published: { color: 'bg-blue-100 text-blue-800', label: 'Published' },
      failed: { color: 'bg-red-100 text-red-800', label: 'Failed' }
    };

    const config = statusConfig[status];
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const renderPipelineStep = () => {
    if (!pipeline) return null;

    switch (pipeline.step) {
      case 'draft':
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Material</h2>
            <DraftForm
              onDraftCreated={handleDraftCreated}
              onCancel={handleCancelPipeline}
            />
          </div>
        );

      case 'upload':
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Audio File</h2>
            <MaterialUpload
              material={pipeline.material!}
              onUploadComplete={handleUploadComplete}
              onCancel={handleCancelPipeline}
            />
          </div>
        );

      case 'publish':
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Publish Material</h2>
            <MaterialEdit
              material={pipeline.material!}
              transcription={pipeline.transcription}
              onPublished={handlePublished}
              onCancel={handleCancelPipeline}
            />
          </div>
        );

      case 'complete':
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Material Published Successfully!
              </h3>
              <p className="text-sm text-gray-600">
                Your material &quot;{pipeline.material?.title}&quot; is now available for learning.
              </p>
            </div>
          </div>
        );

      case 'edit':
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Material</h2>
            <MaterialEdit
              material={pipeline.material!}
              transcription={pipeline.transcription}
              onPublished={handlePublished}
              onCancel={handleCancelPipeline}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Echolingo
          </h1>
          <p className="text-lg text-gray-600">
            Create language learning materials with automatic transcription
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Pipeline */}
          <div className="space-y-6">
            {/* Create New Material Button */}
            {!pipeline && !showCreateForm && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create New Material
                </button>
              </div>
            )}

            {/* Draft Form */}
            {!pipeline && showCreateForm && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <DraftForm
                  onDraftCreated={(material) => {
                    handleDraftCreated(material);
                    setShowCreateForm(false);
                  }}
                  onCancel={() => setShowCreateForm(false)}
                />
              </div>
            )}

            {/* Pipeline Steps */}
            {pipeline && renderPipelineStep()}

            {/* Drafts List */}
            {!pipeline && drafts.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Drafts</h2>
                <div className="space-y-3">
                  {drafts.map((draft) => (
                    <div
                      key={draft.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900 mb-1">
                            {draft.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {draft.language} → {draft.targetLanguage.join(', ')}
                          </p>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(draft.status)}
                            <span className="text-xs text-gray-500">
                              {new Date(draft.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleContinueDraft(draft)}
                            className="inline-flex items-center p-2 text-sm text-primary-600 hover:text-primary-700"
                          >
                            {draft.status === 'draft' ? <Upload className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDeleteDraft(draft.id)}
                            className="inline-flex items-center p-2 text-sm text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Published Materials */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Published Materials
              </h2>
              <button
                onClick={loadData}
                disabled={isLoading}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                {isLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {materials.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No published materials yet.</p>
                <p className="text-sm text-gray-400 mt-2">
                  Create your first material to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {materials.map((material) => (
                  <div
                    key={material.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 mb-1">
                          {material.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {material.transcription?.full_transcript?.substring(0, 300) || '—'}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Level: {material.difficultyLevel}</span>
                          <span>Duration: {material.duration ? `${Math.round(material.duration / 60)}m` : 'N/A'}</span>
                          <span>Language: {material.language} → {material.targetLanguage.join(', ')}</span>
                        </div>
                        {material.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {material.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        <div>Created: {new Date(material.createdAt).toLocaleDateString()}</div>
                        <div>Plays: {material.playCount}</div>
                        <button
                          onClick={() => setPipeline({ step: 'edit', material })}
                          className="mt-2 p-2 text-primary-600 hover:text-primary-700 border border-primary-200 rounded"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 