# Endpoints da API

Documentação completa de todos os endpoints da API, incluindo parâmetros, validações e respostas.

## 🔐 Autenticação (Públicos)

### `POST /api/auth/sign-in` {#post-apiauthsign-in}

Registrar novo usuário (cria user + customer automaticamente).

**Body:**
```json
{
  "email": "user@example.com",
  "nickname": "username",
  "password": "senha123",
  "name": "Nome Completo",
  "document_number": "12345678901"
}
```

**Validações:**
- `email`: Formato válido de email, único
- `nickname`: Mínimo 3 caracteres, único
- `password`: Mínimo 6 caracteres
- `name`: Obrigatório
- `document_number`: CPF (11 dígitos) ou CNPJ (14 dígitos), único

**Resposta 201 (Sucesso):**
```json
{
  "user": {
    "id": "1",
    "nickname": "username",
    "role": "client",
    "customer_id": "1"
  }
}
```
Cookie `token` (HTTP-only) é definido automaticamente.

**Erros:**
- `400`: Parâmetros inválidos
- `409`: Email, nickname ou documento já registrado

---

### `POST /api/auth/login` {#post-apiauthlogin}

Login com nickname e senha.

**Body:**
```json
{
  "nickname": "username",
  "password": "senha123"
}
```

**Resposta 200 (Sucesso):**
```json
{
  "user": {
    "id": "1",
    "nickname": "username",
    "role": "client",
    "customer_id": "1"
  }
}
```
Cookie `token` (HTTP-only) é definido automaticamente.

**Erros:**
- `400`: Nickname e senha são obrigatórios
- `401`: Credenciais inválidas

---

### `POST /api/auth/logout` {#post-apiauthlogout}

Logout (remove cookie de autenticação).

**Autenticação:** Requerida

**Resposta 200 (Sucesso):**
```json
{
  "message": "Logged out successfully"
}
```

---

## 👤 Usuários (Protegidos - requer autenticação)

### `GET /api/users/me` {#get-apiusersme}

Obter informações do usuário logado.

**Autenticação:** Requerida

**Resposta 200 (Sucesso):**
```json
{
  "user": {
    "nickname": "username",
    "role": "client",
    "customer_id": "1",
    "name": "Nome Completo",
    "email": "user@example.com",
    "document_number": "12345678901"
  }
}
```

**Erros:**
- `401`: Não autenticado
- `404`: Usuário não encontrado

---

### `PATCH /api/users/me` {#patch-apiusersme}

Atualizar dados do usuário logado (senha opcional).

**Autenticação:** Requerida

**Body:**
```json
{
  "email": "newemail@example.com",
  "name": "Novo Nome",
  "document_number": "12345678901",
  "password": "novasenha123"  // Opcional
}
```

**Validações:**
- `email`: Formato válido de email, único
- `name`: Obrigatório
- `document_number`: CPF (11 dígitos) ou CNPJ (14 dígitos), único
- `password`: Mínimo 6 caracteres (se fornecido)

**Resposta 200 (Sucesso):**
```json
{
  "user": {
    "nickname": "username",
    "role": "client",
    "email": "newemail@example.com",
    "name": "Novo Nome",
    "document_number": "12345678901"
  }
}
```

**Erros:**
- `400`: Parâmetros inválidos
- `401`: Não autenticado
- `404`: Usuário não encontrado
- `409`: Email ou documento já registrado

---

### `DELETE /api/users/me` {#delete-apiusersme}

Deletar conta do usuário logado.

**Autenticação:** Requerida

**Resposta 204 (Sucesso):** Sem conteúdo

**Erros:**
- `401`: Não autenticado
- `404`: Usuário não encontrado

---

### `GET /api/users` {#get-apiusers}

Listar todos os usuários (com informações do customer).

**Autenticação:** Requerida (Admin apenas)

**Query Parameters:**
- `limit` (opcional): Número de itens por página (padrão: 50, máximo: 100)
- `offset` (opcional): Número de itens para pular (padrão: 0)

**Resposta 200 (Sucesso):**
```json
{
  "data": [
    {
      "id": "1",
      "nickname": "username",
      "role": "client",
      "customer_id": "1",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z",
      "name": "Nome Completo",
      "email": "user@example.com",
      "document_number": "12345678901"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 100
  }
}
```

---

### `PATCH /api/users/role` {#patch-apiusersrole}

Atualizar role de um usuário por customer_id (admin apenas).

**Autenticação:** Requerida (Admin apenas)

**Body:**
```json
{
  "customer_id": "1",
  "role": "admin"
}
```

**Validações:**
- `customer_id`: Obrigatório
- `role`: Deve ser `"admin"` ou `"client"`

**Resposta 200 (Sucesso):**
```json
{
  "user": {
    "id": "1",
    "nickname": "username",
    "role": "admin",
    "customer_id": "1"
  }
}
```

**Erros:**
- `400`: Parâmetros inválidos ou role inválido
- `404`: Usuário não encontrado para este customer

---

## 👥 Clientes (Admin apenas)

### `GET /api/customers` {#get-apicustomers}

Listar clientes.

**Autenticação:** Requerida (Admin apenas)

**Query Parameters:**
- `limit` (opcional): Número de itens por página (padrão: 50, máximo: 100)
- `offset` (opcional): Número de itens para pular (padrão: 0)

**Resposta 200 (Sucesso):**
```json
{
  "data": [
    {
      "id": "1",
      "name": "Nome Completo",
      "email": "user@example.com",
      "document_number": 12345678901,
      "user_id": "1",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 100
  }
}
```

---

### `GET /api/customers/:id` {#get-apicustomersid}

Buscar cliente por ID.

**Autenticação:** Requerida (Admin apenas)

**Parâmetros de URL:**
- `id`: ID do cliente

**Resposta 200 (Sucesso):**
```json
{
  "id": "1",
  "name": "Nome Completo",
  "email": "user@example.com",
  "document_number": 12345678901,
  "user_id": "1",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

**Erros:**
- `404`: Cliente não encontrado

---

### `POST /api/customers` {#post-apicustomers}

Criar cliente.

**Autenticação:** Requerida (Admin apenas)

**Body:**
```json
{
  "name": "Nome Completo",
  "email": "user@example.com",
  "document_number": "12345678901"
}
```

**Validações:**
- `name`: Obrigatório
- `email`: Formato válido de email, único
- `document_number`: CPF (11 dígitos) ou CNPJ (14 dígitos), único

**Resposta 201 (Sucesso):**
```json
{
  "id": "1",
  "name": "Nome Completo",
  "email": "user@example.com",
  "document_number": 12345678901,
  "user_id": null,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

**Erros:**
- `400`: Parâmetros inválidos
- `409`: Email ou documento já registrado

---

### `PATCH /api/customers/:id` {#patch-apicustomersid}

Atualizar cliente.

**Autenticação:** Requerida (Admin apenas)

**Parâmetros de URL:**
- `id`: ID do cliente

**Body:**
```json
{
  "name": "Novo Nome",
  "email": "newemail@example.com",
  "document_number": "12345678901"
}
```

**Validações:**
- `name`: Obrigatório
- `email`: Formato válido de email, único
- `document_number`: CPF (11 dígitos) ou CNPJ (14 dígitos), único

**Resposta 200 (Sucesso):**
```json
{
  "id": "1",
  "name": "Novo Nome",
  "email": "newemail@example.com",
  "document_number": 12345678901,
  "user_id": "1",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

**Erros:**
- `400`: Parâmetros inválidos
- `404`: Cliente não encontrado
- `409`: Email ou documento já registrado

---

### `DELETE /api/customers/:id` {#delete-apicustomersid}

Deletar cliente.

**Autenticação:** Requerida (Admin apenas)

**Parâmetros de URL:**
- `id`: ID do cliente

**Resposta 204 (Sucesso):** Sem conteúdo

**Erros:**
- `404`: Cliente não encontrado

---

## 📦 Produtos

### `GET /api/products` {#get-apiproducts}

Listar produtos.

**Autenticação:** Requerida

**Query Parameters:**
- `limit` (opcional): Número de itens por página (padrão: 50, máximo: 100)
- `offset` (opcional): Número de itens para pular (padrão: 0)

**Resposta 200 (Sucesso):**
```json
{
  "data": [
    {
      "id": "1",
      "name": "Produto Exemplo",
      "amount": 99.99,
      "stock": 100,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 100
  }
}
```

---

### `GET /api/products/:id` {#get-apiproductsid}

Buscar produto por ID.

**Autenticação:** Requerida

**Parâmetros de URL:**
- `id`: ID do produto

**Resposta 200 (Sucesso):**
```json
{
  "id": "1",
  "name": "Produto Exemplo",
  "amount": 99.99,
  "stock": 100,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

**Erros:**
- `404`: Produto não encontrado

---

### `POST /api/products` {#post-apiproducts}

Criar produto.

**Autenticação:** Requerida (Admin apenas)

**Body:**
```json
{
  "name": "Produto Exemplo",
  "amount": 99.99,
  "stock": 100
}
```

**Validações:**
- `name`: Obrigatório, único
- `amount`: Número não-negativo
- `stock`: Inteiro não-negativo

**Resposta 201 (Sucesso):**
```json
{
  "id": "1",
  "name": "Produto Exemplo",
  "amount": 99.99,
  "stock": 100,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

**Erros:**
- `400`: Parâmetros inválidos
- `409`: Nome do produto já registrado

---

### `PATCH /api/products/:id` {#patch-apiproductsid}

Atualizar produto.

**Autenticação:** Requerida (Admin apenas)

**Parâmetros de URL:**
- `id`: ID do produto

**Body:**
```json
{
  "name": "Produto Atualizado",
  "amount": 149.99,
  "stock": 50
}
```

**Validações:**
- `name`: Obrigatório, único
- `amount`: Número não-negativo
- `stock`: Inteiro não-negativo

**Resposta 200 (Sucesso):**
```json
{
  "id": "1",
  "name": "Produto Atualizado",
  "amount": 149.99,
  "stock": 50,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

**Erros:**
- `400`: Parâmetros inválidos
- `404`: Produto não encontrado
- `409`: Nome do produto já registrado

---

### `DELETE /api/products/:id` {#delete-apiproductsid}

Deletar produto.

**Autenticação:** Requerida (Admin apenas)

**Parâmetros de URL:**
- `id`: ID do produto

**Resposta 204 (Sucesso):** Sem conteúdo

**Erros:**
- `404`: Produto não encontrado

---

## 🛒 Pedidos

### `GET /api/orders` {#get-apiorders}

Listar pedidos.

**Autenticação:** Requerida (Admin apenas)

**Query Parameters:**
- `limit` (opcional): Número de itens por página (padrão: 50, máximo: 100)
- `offset` (opcional): Número de itens para pular (padrão: 0)

**Resposta 200 (Sucesso):**
```json
{
  "data": [
    {
      "id": "1",
      "customer_id": "1",
      "status": "PENDING_PAYMENT",
      "amount": 199.98,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 100
  }
}
```

---

### `GET /api/orders/:id` {#get-apiordersid}

Buscar pedido por ID (com items). Clientes só podem ver seus próprios pedidos.

**Autenticação:** Requerida

**Parâmetros de URL:**
- `id`: ID do pedido

**Status dos Pedidos:**
- `PENDING_PAYMENT` - Aguardando confirmação de pagamento
- `CONFIRMED` - Pagamento confirmado e estoque debitado
- `CANCELLED` - Cancelado por falta de estoque na confirmação
- `PAYMENT_FAILED` - Pagamento rejeitado

**Resposta 200 (Sucesso):**
```json
{
  "id": "1",
  "customer_id": "1",
  "status": "PENDING_PAYMENT",
  "amount": 199.98,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z",
  "items": [
    {
      "id": "1",
      "order_id": "1",
      "product_id": "1",
      "quantity": 2,
      "amount": 199.98,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Erros:**
- `401`: Não autenticado
- `404`: Pedido não encontrado ou não pertence ao usuário

---

### `POST /api/orders` {#post-apiorders}

Criar pedido. Clientes criam para si mesmos, admins podem criar para qualquer cliente.

**Autenticação:** Requerida

**Body:**
```json
{
  "customer_id": "1",
  "items": [
    {
      "product_id": "1",
      "quantity": 2
    },
    {
      "product_id": "2",
      "quantity": 1
    }
  ]
}
```

**Validações:**
- `customer_id`: Obrigatório (admin pode especificar qualquer cliente, clientes usam automaticamente seu próprio ID)
- `items`: Array não-vazio de itens
  - `product_id`: ID do produto (deve existir)
  - `quantity`: Inteiro positivo (deve haver estoque suficiente)

**Resposta 201 (Sucesso):**
```json
{
  "id": "1",
  "customer_id": "1",
  "status": "PENDING_PAYMENT",
  "amount": 199.98,
  "items": [
    {
      "id": "1",
      "product_id": "1",
      "quantity": 2,
      "amount": 199.98,
      "product_name": "Produto Exemplo",
      "product_amount": 99.99
    }
  ]
}
```

**Erros:**
- `400`: Parâmetros inválidos, produto sem estoque, quantidade inválida
- `401`: Não autenticado
- `404`: Cliente ou produto não encontrado
- `409`: Produto já existe no pedido (não permitido múltiplos itens do mesmo produto)

---

### `GET /api/orders/customers/:id` {#get-apiorderscustomersid}

Listar pedidos de um cliente específico.

**Autenticação:** Requerida

**Parâmetros de URL:**
- `id`: ID do cliente

**Query Parameters:**
- `limit` (opcional): Número de itens por página (padrão: 50, máximo: 100)
- `offset` (opcional): Número de itens para pular (padrão: 0)

**Resposta 200 (Sucesso):**
```json
{
  "data": [
    {
      "id": "1",
      "customer_id": "1",
      "status": "CONFIRMED",
      "amount": 199.98,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 10
  }
}
```

**Erros:**
- `404`: Cliente não encontrado

