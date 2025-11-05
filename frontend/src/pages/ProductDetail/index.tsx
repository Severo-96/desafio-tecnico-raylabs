import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productService } from '../../services/productService';
import type { Product } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, parseCurrency, formatStock, parseStock, formatCurrencyNumber, formatDate } from '../../utils/formatters';
import './index.css';

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', amount: '', stock: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    if (id) {
      loadProduct();
    }
  }, [id, user, navigate]);

  const loadProduct = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError('');
      const data = await productService.getById(Number(id));
      console.log('Product received:', data);
      setProduct(data);
      setEditForm({
        name: data.name,
        amount: formatCurrencyNumber(data.amount),
        stock: data.stock.toString(),
      });
    } catch (err: any) {
      console.error('Error loading product:', err);
      if (err.response?.status === 404) {
        setError('Produto não encontrado');
      } else {
        setError(err.response?.data?.message || 'Erro ao carregar produto');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (product) {
      setEditForm({
        name: product.name,
        amount: product.amount.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        stock: product.stock.toString(),
      });
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (product) {
      setEditForm({
        name: product.name,
        amount: product.amount.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        stock: product.stock.toString(),
      });
    }
  };


  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setEditForm({ ...editForm, amount: formatted });
  };

  const handleStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatStock(e.target.value);
    setEditForm({ ...editForm, stock: formatted });
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !product) return;

    try {
      setSaving(true);
      setError('');
      
      const amount = editForm.amount.trim() === '' ? 0 : parseCurrency(editForm.amount);
      const stock = editForm.stock.trim() === '' ? 0 : parseStock(editForm.stock);
      
      const updated = await productService.update(Number(id), {
        name: editForm.name,
        amount: amount,
        stock: stock,
      });

      console.log('Product updated:', updated);
      setProduct(updated);
      setIsEditing(false);
    } catch (err: any) {
      console.error('Error updating product:', err);
      setError(err.response?.data?.message || 'Erro ao atualizar produto');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !product) return;
    
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir o produto "${product.name}"?\n\nEsta ação não pode ser desfeita.`
    );
    
    if (!confirmed) return;

    try {
      setDeleting(true);
      setError('');
      await productService.delete(Number(id));
      console.log('Product deleted successfully');
      navigate('/products');
    } catch (err: any) {
      console.error('Error deleting product:', err);
      setError(err.response?.data?.message || 'Erro ao excluir produto');
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="loading">Carregando produto...</div>;
  }

  if (error) {
      return (
        <div className="product-detail-page">
          <div className="error">{error}</div>
          <Link to="/products" className="back-button">
            ← VOLTAR
          </Link>
        </div>
      );
  }

  if (!product) {
      return (
        <div className="product-detail-page">
          <div className="error">Produto não encontrado</div>
          <Link to="/products" className="back-button">
            ← VOLTAR
          </Link>
        </div>
      );
  }

  return (
    <div className="product-detail-page">
      <Link to="/products" className="back-button">
        ← VOLTAR
      </Link>
      
      <div className="product-detail-card">
        <div className="product-detail-header">
          <h1>{product.name}</h1>
          <div className="header-actions">
            <span className={`product-stock-badge ${product.stock === 0 ? 'out-of-stock' : 'in-stock'}`}>
              {product.stock === 0 ? 'Sem estoque' : `${product.stock} unidades disponíveis`}
            </span>
            {!isEditing && (
              <div className="action-buttons">
                <button onClick={handleEdit} className="edit-btn">
                  ✏️ Editar
                </button>
                <button onClick={handleDelete} className="delete-btn" disabled={deleting}>
                  {deleting ? 'Excluindo...' : '🗑️ Excluir'}
                </button>
              </div>
            )}
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {isEditing ? (
          <form onSubmit={handleSave} className="edit-form">
            <div className="form-group">
              <label htmlFor="name">Nome do Produto</label>
              <input
                id="name"
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>

                <div className="form-group">
                  <label htmlFor="amount">Preço (R$)</label>
                  <input
                    id="amount"
                    type="text"
                    value={editForm.amount}
                    onChange={handleAmountChange}
                    placeholder="0,00"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="stock">Estoque</label>
                  <input
                    id="stock"
                    type="text"
                    value={editForm.stock}
                    onChange={handleStockChange}
                    placeholder="0"
                  />
                </div>

            <div className="form-actions">
              <button type="button" onClick={handleCancel} className="cancel-btn" disabled={saving}>
                Cancelar
              </button>
              <button type="submit" className="save-btn" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        ) : (
          <div className="product-detail-content">
            <div className="product-detail-info">
              <div className="info-row">
                <span className="info-label">ID:</span>
                <span className="info-value">#{product.id}</span>
              </div>
              
              <div className="info-row">
                <span className="info-label">Preço:</span>
                <span className="info-value price">R$ {Number(product.amount).toFixed(2)}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Estoque:</span>
                <span className="info-value">{product.stock} unidades</span>
              </div>

              <div className="info-row">
                <span className="info-label">Criado em:</span>
                <span className="info-value">
                  {formatDate(product.created_at)}
                </span>
              </div>

              <div className="info-row">
                <span className="info-label">Atualizado em:</span>
                <span className="info-value">
                  {formatDate(product.updated_at)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

