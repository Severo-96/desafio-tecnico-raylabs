import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { formatDocument, parseDocument } from '../../utils/formatters';
import './index.css';

export function SignIn() {
  const [formData, setFormData] = useState({
    nickname: '',
    password: '',
    email: '',
    name: '',
    document_number: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'document_number') {
      const numbers = parseDocument(value);
      const limited = numbers.slice(0, 14);
      const formatted = formatDocument(limited);
      setFormData({ ...formData, document_number: formatted });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const documentNormalized = parseDocument(formData.document_number);
      await signIn({
        ...formData,
        document_number: documentNormalized,
      });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Cadastro</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nickname">Nickname</label>
            <input
              id="nickname"
              name="nickname"
              type="text"
              value={formData.nickname}
              onChange={handleChange}
              required
              minLength={3}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label htmlFor="name">Nome Completo</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="document_number">CPF ou CNPJ</label>
            <input
              id="document_number"
              name="document_number"
              type="text"
              value={formData.document_number}
              onChange={handleChange}
              required
              maxLength={18}
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>
        <p className="auth-link">
          Já tem conta? <Link to="/login">Faça login</Link>
        </p>
      </div>
    </div>
  );
}

