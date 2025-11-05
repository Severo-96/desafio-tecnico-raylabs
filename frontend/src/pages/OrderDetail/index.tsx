import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import type { Order } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../utils/formatters';
import './index.css';

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadOrder();
    }
  }, [id]);

  const loadOrder = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError('');
      const data = await orderService.getById(Number(id));
      console.log('Order received:', data);
      setOrder(data);
    } catch (err: any) {
      console.error('Error loading order:', err);
      if (err.response?.status === 404) {
        setError('Pedido não encontrado');
      } else {
        setError(err.response?.data?.message || 'Erro ao carregar pedido');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; class: string }> = {
      PENDING_PAYMENT: { label: 'Aguardando Pagamento', class: 'status-warning' },
      CONFIRMED: { label: 'Confirmado', class: 'status-success' },
      CANCELLED: { label: 'Cancelado', class: 'status-danger' },
      PAYMENT_FAILED: { label: 'Pagamento Falho', class: 'status-danger' },
    };
    const statusInfo = statusMap[status] || { label: status, class: '' };
    return (
      <span className={`status-badge ${statusInfo.class}`}>{statusInfo.label}</span>
    );
  };

  if (loading) {
    return <div className="loading">Carregando pedido...</div>;
  }

  if (error) {
    return (
      <div className="order-detail-page">
        <div className="error">{error}</div>
        <Link to={user?.role === 'admin' ? '/admin/orders' : '/orders'} className="back-button">
          ← VOLTAR
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-detail-page">
        <div className="error">Pedido não encontrado</div>
        <Link to={user?.role === 'admin' ? '/admin/orders' : '/orders'} className="back-button">
          ← VOLTAR
        </Link>
      </div>
    );
  }

  return (
    <div className="order-detail-page">
      <Link to={user?.role === 'admin' ? '/admin/orders' : '/orders'} className="back-button">
        ← VOLTAR
      </Link>
      
      <div className="order-detail-card">
        <div className="order-detail-header">
          <div>
            <h1>Pedido #{order.id}</h1>
            {getStatusBadge(order.status)}
          </div>
          <div className="order-detail-meta">
            <span style={{ color: '#000', fontWeight: '600', fontSize: '1.125rem' }}>
              Total: R$ {Number(order.amount).toFixed(2)}
            </span>
            <span className="order-date">
              {formatDate(order.created_at)}
            </span>
          </div>
        </div>

        {order.customer && (
          <div className="order-info-section">
            <h3>Informações do Cliente</h3>
            <div className="info-row">
              <span className="info-label">Nome:</span>
              <span className="info-value">{order.customer.nickname}</span>
            </div>
            {order.customer.document_number && (
              <div className="info-row">
                <span className="info-label">Documento:</span>
                <span className="info-value">{order.customer.document_number}</span>
              </div>
            )}
          </div>
        )}

        {order.items && order.items.length > 0 && (
          <div className="order-info-section">
            <h3>Itens do Pedido</h3>
            <div className="order-items-table">
              <table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Quantidade</th>
                    <th>Valor Unitário</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.product?.name || `Produto #${item.product_id}`}</td>
                      <td>{item.quantity}</td>
                      <td>R$ {(Number(item.amount) / item.quantity).toFixed(2)}</td>
                      <td>R$ {Number(item.amount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="order-info-section">
          <h3>Informações Adicionais</h3>
          <div className="info-row">
            <span className="info-label">Data de Criação:</span>
            <span className="info-value">
              {formatDate(order.created_at)}
            </span>
          </div>
          {order.updated_at && (
            <div className="info-row">
              <span className="info-label">Última Atualização:</span>
              <span className="info-value">
                {formatDate(order.updated_at)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

