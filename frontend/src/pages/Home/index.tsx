import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './index.css';

export function Home() {
  const { isAuthenticated, user, isLoading } = useAuth();

  // Show loading while checking authentication
  if (isLoading) {
    return <div className="loading">Carregando...</div>;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Show home page if authenticated
  return (
    <div className="home-page">
      <div className="hero">
        <h1>Bem-vindo ao E-Commerce</h1>
        <p>Sua loja online com produtos de qualidade</p>
        <div className={`hero-actions ${user?.role !== 'admin' ? 'hero-actions-center' : ''}`}>
          <div className="hero-actions-left">
            {user?.role === 'admin' && (
              <h3 className="hero-actions-title">Acesso Usuário</h3>
            )}
            <Link to="/orders" className="btn-secondary">
              Meus Pedidos
            </Link>
            <Link to="/orders/new" className="btn-secondary">
              Novo Pedido
            </Link>
            <Link to="/user/profile" className="btn-secondary">
              Meu Usuário
            </Link>
          </div>
          {user?.role === 'admin' && (
            <div className="hero-actions-right">
              <h3 className="hero-actions-title">Acesso Administrador</h3>
              <Link to="/products" className="btn-primary">
                Ver Produtos
              </Link>
              <Link to="/admin/orders" className="btn-primary">
                Ver Pedidos
              </Link>
              <Link to="/admin/customers" className="btn-primary">
                Ver Clientes
              </Link>
              <Link to="/admin/users" className="btn-primary">
                Ver Usuários
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

