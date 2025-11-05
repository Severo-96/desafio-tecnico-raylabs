import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { customerService } from '../../services/customerService';
import { useAuth } from '../../contexts/AuthContext';
import { formatDocument, parseDocument } from '../../utils/formatters';
import './index.css';

export function EditCustomer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editForm, setEditForm] = useState({ 
    name: '', 
    email: '', 
    document_number: ''
  });

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
      const customer = await customerService.getById(Number(id));
      setEditForm({
        name: customer.name,
        email: customer.email,
        document_number: formatDocument(customer.document_number),
      });
    } catch (err: any) {
      console.error('Error loading customer:', err);
      setError(err.response?.data?.message || 'Erro ao carregar cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numbers = parseDocument(value);
    const limited = numbers.slice(0, 14);
    const formatted = formatDocument(limited);
    setEditForm({ ...editForm, document_number: formatted });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (user?.role !== 'admin' || !id) {
      navigate('/');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      const documentNormalized = parseDocument(editForm.document_number);
      
      const updated = await customerService.update(Number(id), {
        name: editForm.name,
        email: editForm.email,
        document_number: documentNormalized,
      });

      console.log('Customer updated:', updated);
      navigate(`/admin/customers/${id}`);
    } catch (err: any) {
      console.error('Error updating customer:', err);
      setError(err.response?.data?.message || 'Erro ao atualizar cliente');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Carregando cliente...</div>;
  }

  return (
    <div className="edit-customer-page">
      <Link to={`/admin/customers/${id}`} className="back-button">
        ← VOLTAR
      </Link>

      <div className="edit-customer-card">
        <h1>Editar Cliente</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-group">
            <label htmlFor="name">Nome *</label>
            <input
              type="text"
              id="name"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              required
              placeholder="Nome completo"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              required
              placeholder="email@exemplo.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="document_number">Documento (CPF/CNPJ) *</label>
            <input
              type="text"
              id="document_number"
              value={editForm.document_number}
              onChange={handleDocumentChange}
              required
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
            />
          </div>

          <div className="form-actions">
            <Link to={`/admin/customers/${id}`} className="cancel-btn">
              Cancelar
            </Link>
            <button type="submit" className="save-btn" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

