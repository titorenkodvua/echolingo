import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MaterialEdit } from '../components/MaterialPublish';
import { Material } from '../types';
import api from '../utils/api';

export const MaterialEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Получаем back из query
  const searchParams = new URLSearchParams(location.search);
  const back = searchParams.get('back') || '/';

  useEffect(() => {
    if (id) {
      api.get(`/materials/${id}`)
        .then(res => {
          if (res.data && res.data.success && res.data.data) {
            setMaterial(res.data.data);
          } else {
            setError('Material not found');
          }
        })
        .catch(() => setError('Material not found'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handlePublished = () => {
    navigate(back);
  };

  const handleCancel = () => {
    navigate(back);
  };

  if (loading) return <div>Loading...</div>;
  if (error || !material) return <div>{error || 'Material not found'}</div>;

  return (
    <div className="min-h-screen bg-base-200 py-8">
      <div className="max-w-2xl mx-auto">
        <MaterialEdit material={material} onPublished={handlePublished} onCancel={handleCancel} />
      </div>
    </div>
  );
}; 