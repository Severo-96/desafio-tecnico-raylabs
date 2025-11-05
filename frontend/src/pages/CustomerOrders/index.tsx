import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import type { Order } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../utils/formatters';
import './index.css';

export function CustomerOrders() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const limit = 50;

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    if (id) {
      loadOrders(true);
    }
  }, [id, user, navigate]);

  const loadOrders = async (reset = false) => {
    if (!id) return;
    try {
      if (reset) {
        setLoading(true);
        setOffset(0);
      } else {
        setLoadingMore(true);
      }
      setError('');
      const currentOffset = reset ? 0 : offset;
      const result = await orderService.getByCustomerId(Number(id), limit, currentOffset);
      console.log('Orders received:', result);
      
      if (reset) {
        setOrders(result.data);
      } else {
        setOrders((prev) => [...prev, ...result.data]);
      }
      
      const nextOffset = currentOffset + result.data.length;
      setHasMore(nextOffset < result.pagination.total);
      setOffset(nextOffset);
    } catch (err: any) {
      console.error('Error loading orders:', err);
      setError(err.response?.data?.message || 'Erro ao carregar pedidos');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadOrders(false);
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
    return <div className="loading">Carregando pedidos...</div>;
  }

  return (
    <div className="orders-page">
      <Link to={`/admin/customers/${id}`} className="back-button">
        ← VOLTAR
      </Link>

      <div className="orders-header">
        <h1>Pedidos do Cliente</h1>
      </div>

      {error && <div className="error">{error}</div>}

      {orders.length === 0 ? (
        <p>Este cliente ainda não possui pedidos.</p>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <Link key={order.id} to={`/orders/${order.id}`} className="order-card-link">
              <div className="order-card">
                <div className="order-header">
                  <div>
                    <strong>Pedido #{order.id}</strong>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="order-meta">
                    <span style={{ color: '#000', fontWeight: '600' }}>Total: R$ {Number(order.amount).toFixed(2)}</span>
                    <span className="order-date">
                      {formatDate(order.created_at)}
                    </span>
                  </div>
                </div>
                {order.items && order.items.length > 0 && (
                  <div className="order-items">
                    <h4>Itens:</h4>
                    <ul>
                      {order.items.map((item) => (
                        <li key={item.id}>
                          {item.product?.name || `Produto #${item.product_id}`} - Qtd:{' '}
                          {item.quantity} - R$ {Number(item.amount).toFixed(2)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {hasMore && (
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="load-more-btn"
          >
            {loadingMore ? 'Carregando...' : 'Próxima Página'}
          </button>
        </div>
      )}
    </div>
  );
}

