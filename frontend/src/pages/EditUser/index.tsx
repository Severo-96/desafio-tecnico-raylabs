import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import { formatDocument, parseDocument } from '../../utils/formatters';
import './index.css';

export function EditUser() {
  const navigate = useNavigate();
  const { user: currentUser, checkAuth } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editForm, setEditForm] = useState({ 
    name: '', 
    email: '', 
    document_number: '',
    password: ''
  });

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    loadUser();
  }, [currentUser, navigate]);

  const loadUser = async () => {
    try {
      setLoading(true);
      setError('');
      const user = await authService.getMe();
      const documentFormatted = user.document_number 
        ? formatDocument(user.document_number) 
        : '';
      setEditForm({
        name: user.name || '',
        email: user.email || '',
        document_number: documentFormatted,
        password: ''
      });
    } catch (err: any) {
      console.error('Error loading user:', err);
      setError(err.response?.data?.message || 'Erro ao carregar usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numbers = parseDocument(value);
    const limited = numbers.slice(0, 14);
    const formatted = formatDocument(limited);
    setEditForm({ ...editForm, document_number: formatted });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError('');
      
      const documentNormalized = parseDocument(editForm.document_number);
      
      const updateData: { email: string; name: string; document_number: string; password?: string } = {
        name: editForm.name,
        email: editForm.email,
        document_number: documentNormalized,
      };

      if (editForm.password) {
        updateData.password = editForm.password;
      }

      await authService.updateUser(updateData);
      await checkAuth();
      console.log('User updated successfully');
      navigate('/user/profile');
    } catch (err: any) {
      console.error('Error updating user:', err);
      setError(err.response?.data?.message || 'Erro ao atualizar usuário');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Carregando usuário...</div>;
  }

  return (
    <div className="edit-user-page">
      <Link to="/user/profile" className="back-button">
        ← VOLTAR
      </Link>

      <div className="edit-user-card">
        <h1>Editar Usuário</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nome *</label>
            <input
              type="text"
              id="name"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              required
              placeholder="Nome completo"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              required
              placeholder="email@exemplo.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="document_number">Documento (CPF/CNPJ) *</label>
            <input
              type="text"
              id="document_number"
              value={editForm.document_number}
              onChange={handleDocumentChange}
              required
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
              maxLength={18}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Nova Senha (deixe em branco para manter a atual)</label>
            <input
              type="password"
              id="password"
              value={editForm.password}
              onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
              placeholder="Mínimo 6 caracteres"
              minLength={6}
            />
          </div>

          <div className="form-actions">
            <Link to="/user/profile" className="cancel-btn">
              Cancelar
            </Link>
            <button type="submit" className="save-btn" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

