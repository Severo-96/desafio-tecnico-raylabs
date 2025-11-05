import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { customerService } from '../../services/customerService';
import { useAuth } from '../../contexts/AuthContext';
import { formatDocument, parseDocument } from '../../utils/formatters';
import './index.css';

export function CreateCustomer() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [createForm, setCreateForm] = useState({ 
    name: '', 
    email: '', 
    document_number: '' 
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numbers = parseDocument(value);
    const limited = numbers.slice(0, 14);
    const formatted = formatDocument(limited);
    setCreateForm({ ...createForm, document_number: formatted });
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
      
      const documentNormalized = parseDocument(createForm.document_number);
      
      const newCustomer = await customerService.create({
        name: createForm.name,
        email: createForm.email,
        document_number: documentNormalized,
      });

      console.log('✅ Cliente criado:', newCustomer);
      navigate(`/admin/customers/${newCustomer.id}`);
    } catch (err: any) {
      console.error('Error creating customer:', err);
      setError(err.response?.data?.message || 'Erro ao criar cliente');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="create-customer-page">
      <Link to="/admin/customers" className="back-button">
        ← VOLTAR
      </Link>

      <div className="create-customer-card">
        <h1>Novo Cliente</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="create-customer-form">
          <div className="form-group">
            <label htmlFor="name">Nome *</label>
            <input
              type="text"
              id="name"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              required
              placeholder="Nome completo"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              required
              placeholder="email@exemplo.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="document_number">Documento (CPF/CNPJ) *</label>
            <input
              type="text"
              id="document_number"
              value={createForm.document_number}
              onChange={handleDocumentChange}
              required
              maxLength={18}
            />
          </div>

          <div className="form-actions">
            <Link to="/admin/customers" className="cancel-btn-link">
              Cancelar
            </Link>
            <button type="submit" className="save-btn" disabled={creating}>
              {creating ? 'Criando...' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

