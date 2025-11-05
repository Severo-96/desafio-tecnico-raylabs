import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { ReactNode } from 'react';
import './Layout.css';

export function Layout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const adminDropdownRef = useRef<HTMLDivElement>(null);
  
  const isAuthPage = location.pathname === '/login' || location.pathname === '/sign-in';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
      if (
        adminDropdownRef.current &&
        !adminDropdownRef.current.contains(event.target as Node)
      ) {
        setAdminDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            🛒 E-Commerce
          </Link>
          <div className="navbar-links">
            {isAuthenticated ? (
              <>
                <div className="dropdown-container" ref={userDropdownRef}>
                  <button
                    className="dropdown-toggle"
                    onClick={() => {
                      setUserDropdownOpen(!userDropdownOpen);
                      setAdminDropdownOpen(false);
                    }}
                  >
                    Acesso Usuário
                  </button>
                  {userDropdownOpen && (
                    <div className="dropdown-menu">
                      <Link
                        to="/orders"
                        className="dropdown-item"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        Meus Pedidos
                      </Link>
                      <Link
                        to="/orders/new"
                        className="dropdown-item"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        Novo Pedido
                      </Link>
                      <Link
                        to="/user/profile"
                        className="dropdown-item"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        Meu Usuário
                      </Link>
                    </div>
                  )}
                </div>
                {user?.role === 'admin' && (
                  <div className="dropdown-container" ref={adminDropdownRef}>
                    <button
                      className="dropdown-toggle"
                      onClick={() => {
                        setAdminDropdownOpen(!adminDropdownOpen);
                        setUserDropdownOpen(false);
                      }}
                    >
                      Acesso Administrador
                    </button>
                    {adminDropdownOpen && (
                      <div className="dropdown-menu">
                        <Link
                          to="/products"
                          className="dropdown-item"
                          onClick={() => setAdminDropdownOpen(false)}
                        >
                          Ver Produtos
                        </Link>
                        <Link
                          to="/admin/orders"
                          className="dropdown-item"
                          onClick={() => setAdminDropdownOpen(false)}
                        >
                          Ver Pedidos
                        </Link>
                        <Link
                          to="/admin/customers"
                          className="dropdown-item"
                          onClick={() => setAdminDropdownOpen(false)}
                        >
                          Ver Clientes
                        </Link>
                        <Link
                          to="/admin/users"
                          className="dropdown-item"
                          onClick={() => setAdminDropdownOpen(false)}
                        >
                          Ver Usuários
                        </Link>
                      </div>
                    )}
                  </div>
                )}
                <div className="user-info">
                  <span>Olá, {user?.nickname}</span>
                  <button onClick={handleLogout} className="logout-btn">
                    Sair
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/sign-in">Cadastrar</Link>
              </>
            )}
          </div>
        </div>
      </nav>
      <main className={`main-content ${isAuthPage ? 'auth-page' : ''}`}>{children}</main>
    </div>
  );
}

