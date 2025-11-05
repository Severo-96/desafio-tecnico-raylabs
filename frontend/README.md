# Frontend - E-Commerce

Aplicação web React para consumir a API do backend de e-commerce.

## 🚀 Tecnologias

- **React 19** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **React Router** - Roteamento
- **Axios** - Cliente HTTP
- **Context API** - Gerenciamento de estado

## 🐳 Rodar com Docker(28.5.1, build e180ab8) e Docker Compose(v2.40.3) instalados. (Recomendado - Sem precisar instalar Node.js/npm)

Este projeto pode ser executado **completamente usando apenas Docker**, sem precisar instalar Node.js, npm ou qualquer outra ferramenta localmente.

### Iniciar o Frontend

```bash
cd frontend
docker-compose up
```

A aplicação estará disponível em `http://localhost:5173`

### Parar o Frontend

```bash
cd frontend
docker-compose down
```

### Executar comandos npm via Docker

Se precisar executar comandos npm (build, lint, etc.) sem instalar npm localmente:

```bash
# Build para produção
docker-compose exec frontend npm run build

# Lint
docker-compose exec frontend npm run lint

# Qualquer outro comando npm
docker-compose exec frontend npm run [comando]
```

Ou use o script helper `docker-run.sh`:

```bash
# Build
./docker-run.sh build

# Lint
./docker-run.sh lint

# Qualquer comando
./docker-run.sh [comando]
```

## 🔧 Configuração

O frontend está configurado para fazer proxy das requisições `/api` para `http://localhost:3000` (backend).

**Certifique-se de que o backend está rodando na porta 3000 antes de iniciar o frontend.**

### Hot Reload

O Docker está configurado com volumes para hot reload automático. Alterações no código são refletidas automaticamente no container.

## 📁 Estrutura do Projeto

```
src/
├── components/        # Componentes reutilizáveis
│   ├── Layout.tsx    # Layout principal com navbar
│   └── ProtectedRoute.tsx  # Componente para rotas protegidas
├── contexts/         # Contextos React
│   └── AuthContext.tsx     # Contexto de autenticação
├── pages/            # Páginas da aplicação
│   ├── Home.tsx      # Página inicial
│   ├── Login.tsx     # Página de login
│   ├── SignIn.tsx    # Página de cadastro
│   ├── Products.tsx  # Listagem de produtos
│   └── Orders.tsx    # Listagem e criação de pedidos
├── services/         # Serviços de API
│   ├── api.ts        # Cliente HTTP configurado
│   ├── authService.ts
│   ├── productService.ts
│   └── orderService.ts
└── types/            # Definições TypeScript
    └── index.ts
```

## 🔐 Autenticação

O sistema usa cookies HTTP-only para autenticação. O axios está configurado com `withCredentials: true` para enviar cookies automaticamente.

### Credenciais de Teste

- **Admin**: `nickname: admin` / `password: admin123`
- **Cliente**: `nickname: personone` / `password: password123`

## 📱 Funcionalidades

### Públicas
- ✅ Página inicial
- ✅ Login
- ✅ Cadastro (Sign-in)

### Protegidas (requer autenticação)
- ✅ Listagem de produtos
- ✅ Visualização de pedidos
- ✅ Criação de pedidos

### Admin
- ✅ Acesso a todas as funcionalidades (via backend)

## 🎨 Estilos

- CSS modules por componente
- Design responsivo
- Paleta de cores moderna (gradientes roxo/azul)

## 📝 Notas

        // Quando roda no Docker, usa host.docker.internal para acessar o host
        // Quando roda localmente, usa localhost

- **Docker é suficiente**: Não é necessário instalar Node.js ou npm localmente
- O front espera o back também rodando em docker, nisso temos pra o docker 
- O proxy do Vite redireciona `/api/*` para `http://host.docker.internal:3000/api/*` ou `http://localhost:3000/api/*` (caso esteja rodando localmente)
- Cookies são enviados automaticamente devido à configuração `withCredentials`
- Rotas protegidas redirecionam para `/login` se não autenticado
- Hot reload funciona automaticamente com volumes do Docker


