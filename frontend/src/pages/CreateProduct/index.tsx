import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { productService } from '../../services/productService';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, parseCurrency, formatStock, parseStock } from '../../utils/formatters';
import './index.css';

export function CreateProduct() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [createForm, setCreateForm] = useState({ name: '', amount: '', stock: '' });

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);


  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setCreateForm({ ...createForm, amount: formatted });
  };

  const handleStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatStock(e.target.value);
    setCreateForm({ ...createForm, stock: formatted });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }

    try {
      setCreating(true);
      setError('');

      const amount = createForm.amount.trim() === '' ? 0 : parseCurrency(createForm.amount);
      const stock = createForm.stock.trim() === '' ? 0 : parseStock(createForm.stock);
      
      const newProduct = await productService.create({
        name: createForm.name,
        amount: amount,
        stock: stock,
      });

      console.log('Product created:', newProduct);
      navigate(`/products/${newProduct.id}`);
    } catch (err: any) {
      console.error('Error creating product:', err);
      setError(err.response?.data?.message || 'Erro ao criar produto');
    } finally {
      setCreating(false);
    }
  };


  return (
    <div className="create-product-page">
      <Link to="/products" className="back-link">
        ← Voltar para produtos
      </Link>

      <div className="create-product-card">
        <h1>Criar Novo Produto</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="create-product-form">
          <div className="form-group">
            <label htmlFor="name">Nome do Produto</label>
            <input
              id="name"
              type="text"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              required
              placeholder="Ex: Produto Exemplo"
            />
          </div>

          <div className="form-group">
            <label htmlFor="amount">Preço (R$)</label>
            <input
              id="amount"
              type="text"
              value={createForm.amount}
              onChange={handleAmountChange}
              placeholder="0,00"
            />
          </div>

          <div className="form-group">
            <label htmlFor="stock">Estoque</label>
            <input
              id="stock"
              type="text"
              value={createForm.stock}
              onChange={handleStockChange}
              placeholder="0"
            />
          </div>

          <div className="form-actions">
            <Link to="/products" className="cancel-btn-link">
              Cancelar
            </Link>
            <button type="submit" className="save-btn" disabled={creating}>
              {creating ? 'Criando...' : 'Criar Produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

