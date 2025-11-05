import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services/userService';
import type { User } from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import { formatDocument, formatDate } from '../../utils/formatters';
import './index.css';

export function Users() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'client'>('client');
  const [updating, setUpdating] = useState(false);
  const limit = 50;

  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      navigate('/');
      return;
    }
    loadUsers(true);
  }, [currentUser, navigate]);

  const loadUsers = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setOffset(0);
      } else {
        setLoadingMore(true);
      }
      setError('');
      const currentOffset = reset ? 0 : offset;
      const result = await userService.getAll(limit, currentOffset);
      console.log('Users received:', result);
      
      if (reset) {
        setUsers(result.data);
      } else {
        setUsers((prev) => [...prev, ...result.data]);
      }
      
      const nextOffset = currentOffset + result.data.length;
      setHasMore(nextOffset < result.pagination.total);
      setOffset(nextOffset);
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError(err.response?.data?.message || 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadUsers(false);
    }
  };

  const handleBadgeClick = (userItem: User) => {
    if (currentUser?.customer_id && String(userItem.customer_id) === String(currentUser.customer_id)) {
      alert('Você não pode alterar seu próprio role.');
      return;
    }
    setEditingUser(userItem);
    setSelectedRole(userItem.role);
  };

  const handleCloseModal = () => {
    setEditingUser(null);
    setSelectedRole('client');
  };

  const handleUpdateRole = async () => {
    if (!editingUser) return;

    try {
      setUpdating(true);
      setError('');
      const updated = await userService.updateRole(editingUser.customer_id, selectedRole);
      
      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? { ...u, role: updated.role } : u))
      );
      
      handleCloseModal();
    } catch (err: any) {
      console.error('Error updating role:', err);
      setError(err.response?.data?.message || 'Erro ao atualizar role do usuário');
    } finally {
      setUpdating(false);
    }
  };

  const getRoleBadge = (role: string, userItem: User) => {
    const isCurrentUser = currentUser?.customer_id && String(userItem.customer_id) === String(currentUser.customer_id);
    const badgeClass = isCurrentUser ? 'user-role-badge-disabled' : 'user-role-badge-clickable';
    
    if (role === 'admin') {
      return (
        <span 
          className={`user-role-badge role-admin ${badgeClass}`}
          onClick={() => !isCurrentUser && handleBadgeClick(userItem)}
          style={{ cursor: isCurrentUser ? 'not-allowed' : 'pointer' }}
          title={isCurrentUser ? 'Você não pode alterar sua própria função' : 'Clique para alterar a função do usuário'}
        >
          Administrador
        </span>
      );
    }
    return null;
  };

  if (loading) {
    return <div className="loading">Carregando usuários...</div>;
  }

  return (
    <div className="users-page">
      <div className="users-header">
        <h1>Usuários</h1>
      </div>

      {error && <div className="error">{error}</div>}

      {users.length === 0 ? (
        <p>Nenhum usuário encontrado.</p>
      ) : (
        <>
          <div className="users-grid">
            {users.map((userItem) => (
              <div key={userItem.id} className="user-card">
                <div className="user-header">
                  <h3>{userItem.nickname}</h3>
                  {getRoleBadge(userItem.role, userItem)}
                </div>
                <div className="user-details">
                  <p><strong>Nome:</strong> {userItem.name}</p>
                  <p><strong>Email:</strong> {userItem.email}</p>
                  <p><strong>Documento:</strong> {formatDocument(userItem.document_number)}</p>
                  <p><strong>Cadastrado em:</strong> {formatDate(userItem.created_at)}</p>
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="load-more-container">
              <button
                className="load-more-btn"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? 'Carregando...' : 'Próxima Página'}
              </button>
            </div>
          )}
        </>
      )}

      {editingUser && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Atualizar Role do Usuário?</h2>
            <p>Usuário: <strong>{editingUser.nickname}</strong></p>
            <div className="modal-form">
              <label htmlFor="role-select">Role:</label>
              <select
                id="role-select"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as 'admin' | 'client')}
                disabled={updating}
              >
                <option value="client">Cliente</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="modal-actions">
              <button
                className="modal-btn modal-btn-cancel"
                onClick={handleCloseModal}
                disabled={updating}
              >
                Cancelar
              </button>
              <button
                className="modal-btn modal-btn-confirm"
                onClick={handleUpdateRole}
                disabled={updating || selectedRole === editingUser.role}
              >
                {updating ? 'Atualizando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

