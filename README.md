# 🐳 Rodar Frontend e Backend com Docker

Este guia simples e rápido mostra como rodar o projeto (frontend e backend) usando apenas Docker, **sem precisar instalar Node.js, npm, npx ou qualquer outra ferramenta localmente**.
Para mais informações indico a leitura dos README.md da pasta backend e frontend.

Cada parte do projeto tem seu próprio `docker-compose.yml` para **maior controle e melhor visualização de logs separados**.

## 📋 Pré-requisitos

- **Docker** instalado
- **Docker Compose** instalado (geralmente vem com o Docker)

## 🚀 Como Rodar

### 1. Subir o Backend

Na pasta backend crie o seu .env e .env.test baseado nos exemplos, e então abra um terminal e execute:

```bash
cd backend
docker-compose up
```

Ou em modo detached (em background):

```bash
cd backend
docker-compose up -d
```

**O que inicia:**
- **db** - PostgreSQL (porta 5432)
- **redis** - Redis (porta 6379)
- **setup** - Executa migrations e seed automaticamente (roda uma vez e para)
- **api** - Backend API (porta 3000)
- **consumer-payment** - Consumer de pagamento
- **consumer-stock** - Consumer de estoque
- **consumer-payment-failed** - Consumer de pagamento falho
- **consumer-outbox** - Processor de eventos da outbox

### 2. Subir o Frontend

Em outro terminal, execute:

```bash
cd frontend
docker-compose up
```

Ou em modo detached (em background):

```bash
cd frontend
docker-compose up -d
```

**O que inicia:**
- **frontend** - Frontend React/Vite (porta 5173)

### 3. Acessar a aplicação

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000

### 4. Parar os serviços

Para parar o backend:

```bash
cd backend
docker-compose down
```

Para parar o frontend:

```bash
cd frontend
docker-compose down
```

Para parar e remover volumes (limpar dados):

```bash
# Backend
cd backend
docker-compose down -v

# Frontend
cd frontend
docker-compose down -v
```

## 🛠️ Comandos Úteis

### Ver logs de um serviço específico

```bash
# Backend
cd backend
docker-compose logs -f api
docker-compose logs -f consumer-payment
docker-compose logs -f db

# Frontend
cd frontend
docker-compose logs -f frontend
```

### Rebuild de um serviço específico

```bash
# Rebuild do backend
cd backend
docker-compose build api
docker-compose up -d api

# Rebuild do frontend
cd frontend
docker-compose build frontend
docker-compose up -d frontend
```

### Executar comandos dentro de um container

```bash
# Frontend
cd frontend
docker-compose exec frontend npm run build

# Backend
cd backend
docker-compose exec api npm run migrate:up
docker-compose exec api npm run db:reset
```

### Reiniciar apenas um serviço

```bash
# Backend
cd backend
docker-compose restart api

# Frontend
cd frontend
docker-compose restart frontend
```

## ❌ Troubleshooting

### Porta já está em uso

Se a porta 5173 ou 3000 já estiver em uso, pare o serviço local ou altere as portas no `docker-compose.yml`:

```yaml
ports:
  - "5174:5173"  # Muda a porta externa para 5174
```

### Erro ao construir a imagem

Se houver erro na construção, tente rebuild forçado:

```bash
# Backend
cd backend
docker-compose build --no-cache api
docker-compose up -d api

# Frontend
cd frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Limpar tudo e começar do zero

```bash
# Backend
cd backend
docker-compose down -v
docker-compose build --no-cache
docker-compose up

# Frontend
cd frontend
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

## 📝 Notas

- **Backend**: O serviço `setup` executa automaticamente as migrations e o seed antes dos outros serviços iniciarem
- **Frontend**: Pode ser iniciado independentemente, mas precisa que o backend esteja rodando na porta 3000
- Todos os `node_modules` são isolados dentro dos containers (não são copiados para o host)
- **Vantagem dos docker-compose separados**: Você pode ver logs separados, reiniciar apenas um serviço, e ter melhor controle sobre cada parte da aplicação
# desafio-tecnico-raylabs
