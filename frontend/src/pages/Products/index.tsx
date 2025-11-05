import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { productService } from '../../services/productService';
import type { Product } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import './index.css';

export function Products() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
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
    loadProducts(true);
  }, [user, navigate]);

  const loadProducts = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setOffset(0);
      } else {
        setLoadingMore(true);
      }
      setError('');
      const currentOffset = reset ? 0 : offset;
      const result = await productService.getAll(limit, currentOffset);
      console.log('Products received:', result);
      
      if (reset) {
        setProducts(result.data);
      } else {
        setProducts((prev) => [...prev, ...result.data]);
      }
      
      const nextOffset = currentOffset + result.data.length;
      setHasMore(nextOffset < result.pagination.total);
      setOffset(nextOffset);
    } catch (err: any) {
      console.error('Error loading products:', err);
      setError(err.response?.data?.message || 'Erro ao carregar produtos');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadProducts(false);
    }
  };


  if (loading) {
    return <div className="loading">Carregando produtos...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="products-page">
      <div className="products-header">
        <h1>Produtos</h1>
        <Link to="/products/new" className="add-product-btn">
          ➕ Novo Produto
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      {products.length === 0 ? (
        <p>Nenhum produto disponível.</p>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <Link
              key={product.id}
              to={`/products/${product.id}`}
              className="product-card-link"
            >
              <div className="product-card">
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <div className="product-details">
                    <span className="product-price">
                      R$ {Number(product.amount).toFixed(2)}
                    </span>
                    <span className={`product-stock ${product.stock === 0 ? 'out-of-stock' : ''}`}>
                      {product.stock === 0 ? 'Sem estoque' : `${product.stock} em estoque`}
                    </span>
                  </div>
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

