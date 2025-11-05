import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import type { User } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { formatDocument } from '../../utils/formatters';
import './index.css';

export function UserProfile() {
  const navigate = useNavigate();
  const { user: currentUser, logout } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

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
      const userData = await authService.getMe();
      console.log('User received:', userData);
      setUser(userData);
    } catch (err: any) {
      console.error('Error loading user:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setError(err.response?.data?.message || 'Erro ao carregar informações do usuário');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    
    const message = `Tem certeza que deseja excluir sua conta?\n\n⚠️ ATENÇÃO: Esta ação não pode ser desfeita. Você será deslogado após a exclusão.`;
    
    const confirmed = window.confirm(message);
    
    if (!confirmed) return;

    try {
      setDeleting(true);
      setError('');
      await authService.deleteUser();
      console.log('User deleted successfully');
      await logout();
      navigate('/login');
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.response?.data?.message || 'Erro ao excluir usuário');
      setDeleting(false);
    }
  };

  const getRoleBadge = (role?: string) => {
    if (role === 'admin') {
      return <span className="user-role-badge role-admin">Administrador</span>;
    } else if (role === 'client') {
      return <span className="user-role-badge role-client">Cliente</span>;
    }
    return null;
  };

  if (loading) {
    return <div className="loading">Carregando informações do usuário...</div>;
  }

  if (error) {
    return (
      <div className="user-profile-page">
        <div className="error">{error}</div>
        <Link to="/" className="back-button">
          ← VOLTAR
        </Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="user-profile-page">
        <div className="error">Usuário não encontrado</div>
        <Link to="/" className="back-button">
          ← VOLTAR
        </Link>
      </div>
    );
  }

  return (
    <div className="user-profile-page">
      <Link to="/" className="back-button">
        ← VOLTAR
      </Link>

      <div className="user-profile-card">
        <div className="user-profile-header">
          <h1>Meu Usuário</h1>
          <div className="header-actions">
            {getRoleBadge(user.role)}
            <Link to="/user/edit" className="edit-btn">
              ✏️ Editar
            </Link>
            <button onClick={handleDelete} className="delete-btn" disabled={deleting}>
              {deleting ? 'Excluindo...' : '🗑️ Excluir'}
            </button>
          </div>
        </div>

        <div className="user-profile-section">
          <h2>Informações da Conta</h2>
          <div className="detail-row">
            <span className="detail-label">Nickname:</span>
            <span className="detail-value">{user.nickname}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Role:</span>
            <span className="detail-value">{user.role === 'admin' ? 'Administrador' : 'Cliente'}</span>
          </div>
        </div>

        <div className="user-profile-section">
          <h2>Informações Pessoais</h2>
          {user.name && (
            <div className="detail-row">
              <span className="detail-label">Nome:</span>
              <span className="detail-value">{user.name}</span>
            </div>
          )}
          <div className="detail-row">
            <span className="detail-label">Email:</span>
            <span className="detail-value">{user.email}</span>
          </div>
          {user.document_number && (
            <div className="detail-row">
              <span className="detail-label">Documento:</span>
              <span className="detail-value">{formatDocument(user.document_number)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

