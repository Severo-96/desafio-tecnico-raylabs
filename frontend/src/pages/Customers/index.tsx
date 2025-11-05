import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { customerService } from '../../services/customerService';
import type { Customer } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { formatDocument, formatDate } from '../../utils/formatters';
import './index.css';

export function Customers() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
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
    loadCustomers(true);
  }, [user, navigate]);

  const loadCustomers = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setOffset(0);
      } else {
        setLoadingMore(true);
      }
      setError('');
      const currentOffset = reset ? 0 : offset;
      const result = await customerService.getAll(limit, currentOffset);
      console.log('Customers received:', result);
      
      const currentCustomerId = user?.customer_id;
      if (!currentCustomerId) {
        if (reset) {
          setCustomers(result.data);
        } else {
          setCustomers((prev) => [...prev, ...result.data]);
        }
      } else {
        const normalizedCustomerId = Number(currentCustomerId);
        const filteredData = result.data.filter(
          (customer) => Number(customer.id) !== normalizedCustomerId
        );
        
        if (reset) {
          setCustomers(filteredData);
        } else {
          setCustomers((prev) => {
            const prevFiltered = prev.filter(
              (customer) => Number(customer.id) !== normalizedCustomerId
            );
            return [...prevFiltered, ...filteredData];
          });
        }
      }
      
      const nextOffset = currentOffset + result.data.length;
      setHasMore(nextOffset < result.pagination.total);
      setOffset(nextOffset);
    } catch (err: any) {
      console.error('Error loading customers:', err);
      setError(err.response?.data?.message || 'Erro ao carregar clientes');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadCustomers(false);
    }
  };

  if (loading) {
    return <div className="loading">Carregando clientes...</div>;
  }

  return (
    <div className="customers-page">
      <div className="customers-header">
        <h1>Clientes</h1>
        <Link to="/admin/customers/new" className="add-customer-btn">
          ➕ Novo Cliente
        </Link>
      </div>

      {error && <div className="error">{error}</div>}

      {customers.length === 0 ? (
        <p>Nenhum cliente encontrado.</p>
      ) : (
        <div className="customers-list">
          {customers.map((customer) => (
            <Link key={customer.id} to={`/admin/customers/${customer.id}`} className="customer-card-link">
              <div className="customer-card">
              <div className="customer-header">
                <div>
                  <strong>{customer.name}</strong>
                </div>
                <div className="customer-meta">
                  <span className="customer-date">
                    Cadastrado em:{' '}
                    {formatDate(customer.created_at)}
                  </span>
                </div>
              </div>
              <div className="customer-details">
                <div className="customer-info">
                  <span>
                    <strong>Documento:</strong> {formatDocument(customer.document_number)}
                  </span>
                  <span>
                    <strong>Email:</strong> {customer.email}
                  </span>
                  {customer.phone && (
                    <span>
                      <strong>Telefone:</strong> {customer.phone}
                    </span>
                  )}
                </div>
                {customer.user_id && (
                  <div className="customer-role-wrapper">
                    <span className="customer-role-badge role-has-user">
                      Possui Usuário
                    </span>
                  </div>
                )}
              </div>
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

