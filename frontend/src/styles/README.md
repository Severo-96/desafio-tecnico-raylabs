# Design System - Sistema de Estilos Unificado

Este diretório contém o sistema de design centralizado para o frontend, facilitando a manutenção e consistência visual.

## Estrutura

```
styles/
├── variables.css    # Variáveis CSS (Design Tokens)
└── components.css   # Componentes reutilizáveis (botões, cards, badges, etc.)
```

## Uso

### Variáveis CSS

Todas as variáveis são prefixadas com `--` e podem ser usadas em qualquer arquivo CSS:

```css
/* ❌ Antes */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
padding: 0.5rem 1rem;
border-radius: 4px;

/* ✅ Depois */
background: var(--color-primary-gradient);
padding: var(--spacing-sm) var(--spacing-md);
border-radius: var(--radius-sm);
```

### Componentes Reutilizáveis

Use as classes compartilhadas em vez de criar estilos duplicados:

```html
<!-- Botão primário -->
<button class="btn-primary">Salvar</button>

<!-- Botão secundário -->
<button class="btn-secondary">Cancelar</button>

<!-- Card -->
<div class="card">
  <div class="card-header">Título</div>
  <div class="card-body">Conteúdo</div>
</div>

<!-- Badge de status -->
<span class="status-badge status-success">Confirmado</span>
```

## Variáveis Disponíveis

### Cores
- `--color-primary-start`, `--color-primary-end`, `--color-primary-gradient`
- `--color-white`, `--color-white-transparent-20`, `--color-white-transparent-30`
- `--color-text-primary`, `--color-text-secondary`, `--color-text-tertiary`
- `--color-status-success`, `--color-status-warning`, `--color-status-danger`

### Espaçamento
- `--spacing-xs` (0.25rem)
- `--spacing-sm` (0.5rem)
- `--spacing-md` (1rem)
- `--spacing-lg` (1.5rem)
- `--spacing-xl` (2rem)
- `--spacing-2xl` (2.5rem)

### Bordas
- `--radius-sm` (4px)
- `--radius-md` (6px)
- `--radius-lg` (12px)

### Sombras
- `--shadow-sm`
- `--shadow-md`
- `--shadow-lg`

### Tipografia
- `--font-weight-normal`, `--font-weight-medium`, `--font-weight-semibold`
- `--font-size-sm`, `--font-size-base`, `--font-size-lg`, `--font-size-xl`

## Componentes Disponíveis

### Botões Principais
- `.btn-primary` - Botão primário (gradiente roxo)
- `.btn-secondary` - Botão secundário (transparente)
- `.btn-outline` - Botão com borda

### Botões de Ação
- `.back-button` - Botão de voltar (padronizado em todas as páginas)
- `.edit-btn` - Botão de editar (96x36px, gradiente roxo)
- `.delete-btn` - Botão de excluir (96x36px, gradiente vermelho)
- `.save-btn` - Botão de salvar em formulários
- `.cancel-btn`, `.cancel-btn-link` - Botão de cancelar em formulários

### Botões de Adição
- `.add-order-btn` - Botão "Novo Pedido"
- `.add-product-btn` - Botão "Novo Produto"
- `.add-customer-btn` - Botão "Novo Cliente"

### Cards
- `.card` - Container de card genérico
- `.card-header`, `.card-body`, `.card-footer` - Seções do card
- `.product-card`, `.customer-card`, `.order-card`, `.user-card` - Cards específicos com hover
- `.product-card-link`, `.customer-card-link`, `.order-card-link`, `.user-card-link` - Links dos cards

### Status Badges
- `.status-badge` - Base do badge
- `.status-success` - Badge verde (sucesso)
- `.status-warning` - Badge amarelo (aviso)
- `.status-danger` - Badge vermelho (perigo)
- `.status-info` - Badge azul (informação)

### Formulários
- `.form-group` - Grupo de formulário
- `.form-actions` - Container de ações do formulário (Salvar/Cancelar)
- `.error-message` - Mensagem de erro padronizada

### Informações
- `.detail-row`, `.info-row` - Linhas de informação (flex, espaçamento, bordas)

### Utilitários
- `.loading` - Mensagem de carregamento centralizada

## Migração

Para migrar um arquivo CSS existente:

1. Substitua valores hardcoded por variáveis
2. Use classes compartilhadas quando possível
3. Mantenha apenas estilos específicos da página

### Exemplo de Migração

```css
/* ❌ Antes */
.my-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 500;
}

/* ✅ Depois */
.my-button {
  /* Use a classe compartilhada se possível */
  /* Ou use variáveis */
  background: var(--color-primary-gradient);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-sm);
  font-weight: var(--font-weight-medium);
}
```

