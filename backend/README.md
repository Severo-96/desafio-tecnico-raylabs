# E-commerce Backend

Sistema de backend para e-commerce com processamento assíncrono de pedidos, pagamentos e estoque.

## 🚀 Setup Inicial

**Requisitos:** Apenas Docker(28.5.1, build e180ab8) e Docker Compose(v2.40.3) instalados. Não é necessário Node.js ou npm!

### 1. Configurar variáveis de ambiente

Copie os arquivos de exemplo e configure as variáveis (tome nota a url da database é ligada ao docker pra evitar criar qualquer coisa localmente):

```bash
# Copiar exemplo de desenvolvimento
cp .env.example .env

# Copiar exemplo de testes
cp .env.test.example .env.test
```

**Arquivo `.env`** (desenvolvimento):
```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/ecommerce 
REDIS_URL=redis://localhost:6379
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long-for-security
JWT_EXPIRES_IN=1d
```

**Arquivo `.env.test`** (testes):
```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/ecommerce_test
REDIS_URL=redis://localhost:6379
NODE_ENV=test
JWT_SECRET=test-secret-key-minimum-32-characters-long-for-security
JWT_EXPIRES_IN=1d
```

**⚠️ Importante:** 
- `JWT_SECRET` é obrigatório e deve ter pelo menos 32 caracteres
- `JWT_EXPIRES_IN` define a validade do token (padrão: `1d` = 1 dia)
- **Altere o `JWT_SECRET` em produção** - nunca use valores de exemplo!

### 2. Subir serviços com Docker
```bash
docker compose up -d
```

Isso irá iniciar:
- PostgreSQL na porta 5432
- Redis na porta 6379
- **Setup automático** - O serviço `setup` executa migrations e seed antes dos outros serviços iniciarem

**Nota:** O Docker Compose executa automaticamente o setup antes de iniciar a API e os consumers. Para executar manualmente:
```bash
docker compose run --rm api npm run setup
```

Este comando irá:
- ✅ Criar todas as tabelas (migrations)
- ✅ Popular banco com dados de teste (seed)
- ✅ Testar conexão com Redis

## 📜 Scripts Disponíveis

Todos os comandos abaixo podem ser executados via Docker, sem precisar instalar Node.js ou npm localmente.

### Migrations
```bash
# Executar todas as migrations pendentes
docker compose run --rm api npm run migrate:up

# Reverter última migration executada
docker compose run --rm api npm run migrate:down

# Reverter migration específica por nome
docker compose run --rm api npm run migrate:down -- 001_create_customers_table
docker compose run --rm api npm run migrate:down -- 003_create_orders_table
```

### Seeds
```bash
# Popular banco com dados de teste
docker compose run --rm api npm run seed:run

# Limpar dados de seed (mantém estrutura)
docker compose run --rm api npm run seed:clear
```

### Reset
```bash
# Limpar todos os dados (exceto migrations) e popular automaticamente com seeds
# Útil para testes e reiniciar ambiente de desenvolvimento
docker compose run --rm api npm run db:reset
```

### Desenvolvimento

Os serviços de desenvolvimento já estão configurados no `docker-compose.yml` e iniciam automaticamente:

```bash
# Subir todos os serviços (API, consumers, banco, Redis)
docker compose up -d

# Ver logs dos serviços
docker compose logs -f api

# Parar todos os serviços
docker compose down
```

**Serviços disponíveis:**
- `api` - API REST (porta 3000)
- `consumer-outbox` - Processor de eventos da outbox
- `consumer-payment` - Consumer de pagamento
- `consumer-stock` - Consumer de estoque
- `consumer-payment-failed` - Consumer de pagamento falho

### Testes
```bash
# Executar todos os testes (usa banco de teste automaticamente)
docker compose --profile test run --rm test
```

**⚠️ Importante:** 
- Use o serviço `test` para rodar testes (não use `api`)
- O serviço `test` está configurado com:
  - `NODE_ENV=test`
  - `DATABASE_URL=postgresql://postgres:postgres@db:5432/ecommerce_test`
  - Variáveis JWT para testes

**❌ Não faça isso:**
```bash
docker compose run --rm api npm test  # ❌ Isso usará o banco de desenvolvimento!
```

## 🏗️ Estrutura do Projeto

```
src/
├── api/              # Controllers e rotas
├── core/              # Repositórios e lógica de negócio
├── events/            # Producers e consumers (Redis Streams)
├── infra/             # Database, migrations, transactions
├── middlewares/       # Middlewares do Express
├── scripts/           # Scripts de setup e migração
├── tests/             # Testes E2E
└── utils/             # Utilitários
```

## 📊 Endpoints da API

> 📄 **Documentação completa:** Para ver a documentação detalhada de todos os endpoints (parâmetros, validações, respostas), consulte o arquivo [API_ENDPOINTS.md](./API_ENDPOINTS.md).

### 🔐 Autenticação (Públicos)
- `POST /api/auth/sign-in` - Registrar novo usuário (cria user + customer)
- `POST /api/auth/login` - Login com nickname e senha
- `POST /api/auth/logout` - Logout (requer autenticação)

### 👤 Usuários (Protegidos - requer autenticação)
- `GET /api/users/me` - Obter informações do usuário logado
- `PATCH /api/users/me` - Atualizar dados do usuário logado (senha opcional)
- `DELETE /api/users/me` - Deletar conta do usuário logado
- `PATCH /api/users/role` - Atualizar role de um usuário por customer_id (admin apenas)

### 👥 Clientes (Admin apenas)
- `GET /api/customers` - Listar clientes
- `GET /api/customers/:id` - Buscar cliente
- `POST /api/customers` - Criar cliente
- `PATCH /api/customers/:id` - Atualizar cliente
- `DELETE /api/customers/:id` - Deletar cliente

### 📦 Produtos (Admin apenas)
- `GET /api/products` - Listar produtos
- `GET /api/products/:id` - Buscar produto
- `POST /api/products` - Criar produto
- `PATCH /api/products/:id` - Atualizar produto
- `DELETE /api/products/:id` - Deletar produto

### 🛒 Pedidos
- `GET /api/orders` - Listar pedidos (admin apenas)
- `GET /api/orders/:id` - Buscar pedido (com items) - cliente vê apenas seus pedidos
- `POST /api/orders` - Criar pedido (cliente cria para si mesmo, admin pode criar para qualquer cliente)
- `GET /api/orders/customers/:id` - Listar pedidos de um cliente (requer autenticação)

**Status dos Pedidos:**
- `PENDING_PAYMENT` - Aguardando confirmação de pagamento
- `CONFIRMED` - Pagamento confirmado e estoque debitado
- `CANCELLED` - Cancelado por falta de estoque na confirmação
- `PAYMENT_FAILED` - Pagamento rejeitado

## 🔒 Autenticação e Autorização

O sistema usa **JWT (JSON Web Tokens)** armazenados em **HTTP-only cookies** para autenticação.

### Roles de Usuário
- **`admin`** - Acesso completo a todos os endpoints
- **`client`** - Acesso limitado aos seus próprios dados

### Como funciona
1. **Registro/Sign-in**: `POST /api/auth/sign-in` cria usuário e customer, retorna cookie com JWT
2. **Login**: `POST /api/auth/login` autentica e retorna cookie com JWT
3. **Requisições protegidas**: Enviar cookie automaticamente (navegador) ou manualmente via `Cookie: token=...`
4. **Logout**: `POST /api/auth/logout` remove o cookie

### Exemplo de uso
```bash
# Login
curl -X POST 'http://localhost:3000/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"nickname": "admin", "password": "admin123"}' \
  -c cookies.txt

# Usar cookie em requisições protegidas
curl -X GET 'http://localhost:3000/api/users/me' \
  -b cookies.txt
```

## 🔄 Fluxo de Processamento

### Arquitetura de Eventos

O sistema usa **Outbox Pattern** + **Redis Streams**:

1. **Criação de Pedido** (API → Outbox → Redis Streams)
   - Valida estoque
   - Cria pedido e items **dentro de transação**
   - Salva evento `order.created` na **outbox** (mesma transação)
   - Status: `PENDING_PAYMENT`

2. **Outbox Processor** (PostgreSQL → Redis)
   - Lê eventos não publicados da outbox
   - Publica no Redis Stream `order.created`
   - Marca como publicado

3. **Consumer de Pagamento** (Redis → Outbox → Redis)
   - Lê `order.created` do Redis Stream
   - Simula pagamento (50% aprovação)
   - Publica `payment.confirmed` ou `payment.failed` na **outbox**
   - Outbox Processor repete ciclo

4. **Consumer de Estoque** (Redis → Banco)
   - Lê `payment.confirmed` do Redis Stream
   - Verifica idempotência (order já processada?)
   - Valida estoque novamente
   - Se disponível: debita estoque → status `CONFIRMED`
   - Se indisponível: status `CANCELLED`

5. **Consumer de Pagamento Falho** (Redis → Banco)
   - Lê `payment.failed` do Redis Stream
   - Atualiza status para `PAYMENT_FAILED`

## 🗄️ Estrutura do Banco

- `customers` - Clientes
- `users` - Usuários do sistema (autenticação)
- `products` - Produtos
- `orders` - Pedidos
- `order_items` - Itens do pedido
- `outbox` - Eventos para publicação (Outbox Pattern)
- `migrations` - Controle de migrations executadas

### Relacionamentos
- `users.customer_id` → `customers.id` (ON DELETE CASCADE)
- `orders.customer_id` → `customers.id`
- `order_items.order_id` → `orders.id`
- `order_items.product_id` → `products.id`

## 🐳 Docker

O projeto foi projetado para funcionar **100% com Docker**, sem necessidade de instalar Node.js ou npm localmente.

### Comandos principais

```bash
# Iniciar todos os serviços
docker compose up -d

# Ver logs
docker compose logs -f

# Parar todos os serviços
docker compose down

# Rebuild após mudanças no código
docker compose build

# Executar testes
docker compose --profile test run --rm test
```

### Serviços disponíveis

- `setup` - Executa migrations e seed (executa uma vez e para)
- `api` - API REST (porta 3000)
- `consumer-payment` - Consumer de pagamento
- `consumer-stock` - Consumer de estoque
- `consumer-payment-failed` - Consumer de pagamento falho
- `consumer-outbox` - Processor de eventos da outbox
- `db` - PostgreSQL (porta 5432)
- `redis` - Redis (porta 6379)
- `test` - Serviço para executar testes (profile: test)

### Ordem de inicialização

1. `db` e `redis` iniciam primeiro
2. `setup` executa migrations e seed
3. `api` e todos os `consumer-*` iniciam após `setup` completar

## 🧪 Dados de Teste (Seed)

O seed é executado automaticamente pelo serviço `setup` quando você roda `docker compose up -d`.

O seed cria:
- **5 clientes** (incluindo 1 empresa/CNPJ e 1 admin)
- **5 usuários** com diferentes roles:
  - `admin` / `admin123` (role: admin)
  - `personone` / `password123` (role: client)
  - `persontwo` / `password123` (role: client)
  - `companyone` / `password123` (role: client)
  - `personthree` / `password123` (role: client)
- **8 produtos** variados com estoque

**Credenciais padrão:**
- Admin: `nickname: admin`, `password: admin123`
- Clientes: `nickname: personone/persontwo/companyone/personthree`, `password: password123`

**Para executar seed manualmente:**
```bash
docker compose run --rm api npm run seed:run
```

## 📝 Notas Técnicas

### Arquitetura
- **Outbox Pattern** para garantir entrega atômica de eventos
- **Redis Streams** para processamento assíncrono entre consumers
- **JWT** com HTTP-only cookies para autenticação segura
- **Transações** garantem consistência dos dados
- **ESM (ES Modules)** - TypeScript compilado para ESNext
- **Repository Pattern** para separação de lógica de negócio

### Segurança
- Senhas hashadas com **bcrypt** (10 salt rounds)
- Tokens JWT com expiração configurável
- HTTP-only cookies para prevenir XSS
- Validação de inputs em todas as rotas
- Middleware de autenticação e autorização por role

### Processamento de Eventos
- Validação de estoque em duas camadas (criação e confirmação de pagamento)
- Consumidores verificam idempotência antes de processar
- Retry automático (3 tentativas) antes de enviar para Dead Letter Queue (DLQ)
- Lock de produtos durante criação de pedidos para evitar race conditions

### Validações
- **Email**: Formato válido, único por customer
- **Documento**: CPF (11 dígitos) ou CNPJ (14 dígitos), único
- **Senha**: Mínimo 6 caracteres
- **Nickname**: Mínimo 3 caracteres, único
- **Produtos**: Quantidade não-negativa, estoque disponível

## 🔍 Monitoramento

### Redis Streams e Consumers

O sistema usa **Redis Streams** para processamento assíncrono de eventos. Use os comandos abaixo para monitorar o estado dos streams, consumers e DLQs.

#### Acessar Redis CLI dentro do container

```bash
# Conectar ao Redis via Docker
docker compose exec redis redis-cli
```

#### Streams disponíveis

- `order.created` - Stream de pedidos criados
- `payment.confirmed` - Stream de pagamentos confirmados
- `payment.failed` - Stream de pagamentos falhados
- `{stream}:dlq` - Dead Letter Queues (ex: `order.created:dlq`)

#### Consumer Groups

- `payment_group` - Consome `order.created`
- `stock_group` - Consome `payment.confirmed`
- `payment_failed_group` - Consome `payment.failed`

#### Comandos úteis

**Listar todos os streams:**
```redis
KEYS *
```

**Ver informações de um stream:**
```redis
# Ver quantidade de mensagens no stream
XLEN order.created

# Ver últimas mensagens (últimas 10)
XREVRANGE order.created + - COUNT 10
```

**Verificar consumer groups:**
```redis
# Informações do consumer group
XINFO GROUPS order.created

# Informações dos consumers no grupo
XINFO CONSUMERS order.created payment_group
```

**Ver mensagens pendentes:**
```redis
# Ver mensagens pendentes no grupo
XPENDING order.created payment_group

# Ver mensagens pendentes de um consumer específico
XPENDING order.created payment_group - + 10 payment_12345
```

**Ver mensagens em Dead Letter Queue (DLQ):**
```redis
# Ver quantidade de mensagens na DLQ
XLEN order.created:dlq

# Ver mensagens na DLQ (últimas 10)
XREVRANGE order.created:dlq + - COUNT 10

# Ler mensagens da DLQ
XREAD STREAMS order.created:dlq 0
```

**Monitorar mensagens em tempo real:**
```redis
# Monitorar todas as operações (debug)
MONITOR

# Ler novas mensagens de um stream
XREAD COUNT 10 STREAMS order.created $
```

**Limpar streams (cuidado!):**
```redis
# Deletar um stream completamente
DEL order.created

# Deletar mensagens antigas (manter últimas 1000)
XTRIM order.created MAXLEN ~ 1000
```

#### Verificar status dos consumers

Os consumers processam mensagens automaticamente. Verifique os logs:

```bash
# Logs do consumer de pagamento
docker compose logs -f consumer-payment

# Logs do consumer de estoque
docker compose logs -f consumer-stock

# Logs do consumer de pagamento falho
docker compose logs -f consumer-payment-failed

# Logs do outbox processor
docker compose logs -f consumer-outbox
```

#### Exemplo de monitoramento completo

```bash
# 1. Verificar se há mensagens pendentes
docker compose exec redis redis-cli XPENDING order.created payment_group

# 2. Verificar mensagens na DLQ
docker compose exec redis redis-cli XLEN order.created:dlq

# 3. Ver logs dos consumers
docker compose logs --tail=50 consumer-payment consumer-stock
```

