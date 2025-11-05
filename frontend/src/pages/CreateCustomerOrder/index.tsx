import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { productService } from '../../services/productService';
import type { Product } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import './index.css';

export function CreateCustomerOrder() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cart, setCart] = useState<Array<{ product_id: number; quantity: number }>>([]);
  const [creating, setCreating] = useState(false);
  const [productsExpanded, setProductsExpanded] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const productsData = await productService.getAll();
      setProducts(productsData.data);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.response?.data?.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (productId: number) => {
    const existing = cart.find((item) => item.product_id === productId);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.product_id === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { product_id: productId, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.product_id !== productId));
  };

  const updateCartQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(
        cart.map((item) =>
          item.product_id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const product = products.find((p) => p.id === item.product_id);
      if (product) {
        return total + product.amount * item.quantity;
      }
      return total;
    }, 0);
  };

  const handleCreateOrder = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!user?.customer_id) {
      setError('Usuário não autenticado');
      return;
    }
    
    if (cart.length === 0) {
      setError('Adicione pelo menos um item ao carrinho');
      return;
    }

    try {
      setCreating(true);
      setError('');
      const order = await orderService.create({
        customer_id: user.customer_id,
        items: cart,
      });
      console.log('✅ Pedido criado:', order);
      navigate(`/orders/${order.id}`);
    } catch (err: any) {
      console.error('Error creating order:', err);
      setError(err.response?.data?.message || 'Erro ao criar pedido');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div className="orders-page">
      <Link to="/orders" className="back-button">
        ← VOLTAR
      </Link>

      {error && <div className="error">{error}</div>}

      <div className="create-order-card">
        <h2>Criar Pedido</h2>
        <form onSubmit={handleCreateOrder}>
        <div className="products-selector">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0 }}>Produtos</h2>
            <button
              type="button"
              onClick={() => setProductsExpanded(!productsExpanded)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.2rem',
                padding: '0.5rem',
                color: '#666'
              }}
              title={productsExpanded ? 'Minimizar' : 'Expandir'}
            >
              {productsExpanded ? '▼' : '▶'}
            </button>
          </div>
          {productsExpanded && (
            <>
              {products.map((product) => (
                <div key={product.id} className="product-selector-item">
                  <div className="product-info-small">
                    <strong>{product.name}</strong>
                    <span>R$ {Number(product.amount).toFixed(2)}</span>
                    <span className={product.stock === 0 ? 'out-of-stock' : ''}>
                      Estoque: {product.stock}
                    </span>
                  </div>
                  {cart.find((item) => item.product_id === product.id) ? (
                    <div className="cart-controls">
                      <button
                        type="button"
                        onClick={() =>
                          updateCartQuantity(
                            product.id,
                            cart.find((item) => item.product_id === product.id)!.quantity - 1
                          )
                        }
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={product.stock}
                        value={cart.find((item) => item.product_id === product.id)!.quantity}
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          
                          if (inputValue === '') {
                            return;
                          }
                          const newQuantity = parseInt(inputValue, 10);
                          if (!isNaN(newQuantity)) {
                            // If greater than stock, use maximum stock
                            const finalQuantity = Math.min(Math.max(1, newQuantity), product.stock);
                            const previousQuantity = cart.find((item) => item.product_id === product.id)!.quantity;
                            updateCartQuantity(product.id, finalQuantity);
                            
                            // Adjust width only when number of digits changes
                            const previousDigits = previousQuantity.toString().length;
                            const finalDigits = finalQuantity.toString().length;
                            if (previousDigits !== finalDigits) {
                              e.target.style.width = `${Math.max(40, finalDigits * 16 + 20)}px`;
                            }
                          }
                        }}
                        onBlur={(e) => {
                          const inputValue = e.target.value;
                          if (inputValue === '' || isNaN(parseInt(inputValue, 10))) {
                            // If empty or invalid when losing focus, revert to 1
                            updateCartQuantity(product.id, 1);
                          }
                          // Adjust final width based on number of digits of final value
                          const finalValue = cart.find((item) => item.product_id === product.id)!.quantity.toString();
                          const digitCount = finalValue.length;
                          e.target.style.width = `${Math.max(40, digitCount * 16 + 20)}px`;
                        }}
                        onFocus={(e) => {
                          // Adjust width based on number of digits of current value
                          const currentValue = e.target.value.toString();
                          const digitCount = currentValue.length;
                          e.target.style.width = `${Math.max(40, digitCount * 16 + 20)}px`;
                        }}
                        style={{ width: '40px' }}
                        className="quantity-input"
                      />
                      <button
                        type="button"
                        onClick={() => addToCart(product.id)}
                        disabled={cart.find((item) => item.product_id === product.id)!.quantity >= product.stock}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromCart(product.id)}
                        className="remove-btn"
                        title="Remover"
                      >
                        🗑️
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => addToCart(product.id)}
                      disabled={product.stock === 0}
                      className="add-btn"
                    >
                      Adicionar
                    </button>
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        <div className="cart-summary">
          <div>
            <strong>Itens no carrinho: {cart.length}</strong>
            <div style={{ marginTop: '0.5rem', fontSize: '1.25rem', fontWeight: '600', color: '#000' }}>
              Total: R$ {calculateTotal().toFixed(2)}
            </div>
          </div>
          <button 
            type="submit" 
            className="back-button" 
            disabled={creating || cart.length === 0}
            style={{ marginBottom: 0, textDecoration: 'none', cursor: creating || cart.length === 0 ? 'not-allowed' : 'pointer' }}
          >
            {creating ? 'Criando...' : 'Criar Pedido'}
          </button>
        </div>
        </form>
      </div>
    </div>
  );
}

