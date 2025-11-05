import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { customerService } from '../../services/customerService';
import type { Customer } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { formatDocument, formatDate } from '../../utils/formatters';
import './index.css';

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    if (id) {
      loadCustomer();
    }
  }, [id, user, navigate]);

  const loadCustomer = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError('');
      const data = await customerService.getById(Number(id));
      console.log('Customer received:', data);
      setCustomer(data);
    } catch (err: any) {
      console.error('Error loading customer:', err);
      if (err.response?.status === 404) {
        setError('Cliente não encontrado');
      } else {
        setError(err.response?.data?.message || 'Erro ao carregar cliente');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !customer) return;
    
    let message = `Tem certeza que deseja excluir o cliente "${customer.name}"?`;
    
    if (customer.user_id) {
      message += `\n\n⚠️ ATENÇÃO: Este cliente possui um usuário associado. Ao excluir o cliente, o usuário também será excluído.`;
    }
    
    message += `\n\nEsta ação não pode ser desfeita.`;
    
    const confirmed = window.confirm(message);
    
    if (!confirmed) return;

    try {
      setDeleting(true);
      setError('');
      await customerService.delete(Number(id));
      console.log('Customer deleted successfully');
      navigate('/admin/customers');
    } catch (err: any) {
      console.error('Error deleting customer:', err);
      setError(err.response?.data?.message || 'Erro ao excluir cliente');
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="loading">Carregando cliente...</div>;
  }

  if (error) {
    return (
      <div className="customer-detail-page">
        <div className="error">{error}</div>
        <Link to="/admin/customers" className="back-button">
          ← VOLTAR
        </Link>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="customer-detail-page">
        <div className="error">Cliente não encontrado</div>
        <Link to="/admin/customers" className="back-button">
          ← VOLTAR
        </Link>
      </div>
    );
  }

  return (
    <div className="customer-detail-page">
      <Link to="/admin/customers" className="back-button">
        ← VOLTAR
      </Link>

      <div className="customer-detail-card">
        <div className="customer-detail-header-actions">
          <div className="customer-detail-section-header">
            <h2>Informações Pessoais</h2>
            {customer.user_id && (
              <span className="customer-role-badge role-has-user">
                Possui Usuário
              </span>
            )}
          </div>
          <div className="action-buttons">
            <Link to={`/admin/customers/${customer.id}/edit`} className="edit-btn">
              ✏️ Editar
            </Link>
            <button onClick={handleDelete} className="delete-btn" disabled={deleting}>
              {deleting ? 'Excluindo...' : '🗑️ Excluir'}
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="customer-detail-section">
          <div className="detail-row">
            <span className="detail-label">Nome:</span>
            <span className="detail-value">{customer.name}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Documento:</span>
            <span className="detail-value">{formatDocument(customer.document_number)}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Email:</span>
            <span className="detail-value">{customer.email}</span>
          </div>
          {customer.phone && (
            <div className="detail-row">
              <span className="detail-label">Telefone:</span>
              <span className="detail-value">{customer.phone}</span>
            </div>
          )}
          {customer.user_nickname && (
            <div className="detail-row">
              <span className="detail-label">Usuário:</span>
              <span className="detail-value">
                {customer.user_nickname}
                {customer.user_role && ` (${customer.user_role})`}
              </span>
            </div>
          )}
          <div className="detail-row">
            <span className="detail-label">Data de Cadastro:</span>
            <span className="detail-value">
              {formatDate(customer.created_at)}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Última Atualização:</span>
            <span className="detail-value">
              {formatDate(customer.updated_at)}
            </span>
          </div>
        </div>

        <div className="customer-detail-footer">
          <Link to={`/admin/customers/${customer.id}/orders`} className="orders-btn">
            Pedidos
          </Link>
        </div>
      </div>
    </div>
  );
}

