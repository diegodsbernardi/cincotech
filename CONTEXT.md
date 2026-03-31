# TOCS CRM — Contexto Completo para Agente de IA

> Use este documento como guia completo do projeto. Ele descreve o que foi construído, como funciona, e o que deve ser feito a seguir.

---

## 🧭 O que é o TOCS CRM?

Sistema de gestão para restaurantes, focado em:
1. **Controle de CMV (Custo de Mercadoria Vendida)** — custo de ingredientes vs receita gerada
2. **Fichas Técnicas** — composição de pratos com custo automático por ingrediente
3. **Gestão de Estoque** — controle de quantidades e custos de insumos
4. **Registro de Vendas** — lançamento de vendas com baixa automática no estoque
5. **Importação Excel** — carga em massa via planilha template

É um SaaS multi-tenant: cada restaurante vê somente seus próprios dados, isolados por `restaurant_id`.

---

## 🛠 Stack Técnica

| Camada | Tecnologia |
|--------|-----------|
| UI Framework | React 19 + TypeScript |
| Bundler | Vite 8 |
| Estilização | Tailwind CSS 4 |
| Roteamento | React Router DOM 7 |
| Backend / DB | Supabase (PostgreSQL + Auth) |
| Ícones | Lucide React |
| Excel | xlsx (SheetJS) |

Credenciais Supabase ficam em `.env.local` (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY).

---

## 📁 Estrutura de Arquivos

```
src/
├── App.tsx                  # Roteamento + PrivateRoute
├── main.tsx                 # Entry point
├── index.css                # Tailwind global
├── contexts/
│   └── AuthContext.tsx      # Estado global de autenticação
├── lib/
│   ├── supabase.ts          # Cliente Supabase
│   └── tocsTemplate.ts      # Estrutura e parsing do template Excel
├── components/
│   ├── Layout.tsx           # Sidebar + Header (wrap das páginas privadas)
│   └── ExcelImporter.tsx    # Upload e processamento de Excel
└── pages/
    ├── Login.tsx            # /login
    ├── Register.tsx         # /register
    ├── ResetPassword.tsx    # /reset-password
    ├── UpdatePassword.tsx   # /update-password
    ├── Dashboard.tsx        # / (home)
    ├── Recipes.tsx          # /recipes
    ├── Ingredients.tsx      # /ingredients
    └── Sales.tsx            # /sales
```

---

## 🗄 Schema do Banco (Supabase / PostgreSQL)

### `profiles`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | = auth.users.id |
| restaurant_id | uuid | FK para restaurante |

### `ingredients`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| restaurant_id | uuid | Multi-tenant |
| name | text | Nome do insumo |
| type | text | 'insumo' \| 'preparo' \| 'bebida' |
| unit_type | text | 'kg', 'g', 'l', 'ml', 'un', 'cx', 'pct', 'fardo' |
| avg_cost_per_unit | numeric | Custo médio por unidade |
| stock_quantity | numeric | Estoque atual |

### `recipes`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| restaurant_id | uuid | Multi-tenant |
| product_name | text | Nome do produto/prato |
| sale_price | numeric | Preço de venda |
| category | text | 'Lanche', 'Porção', 'Sobremesa', 'Combo', 'Bebida', 'Outro' |

### `recipe_ingredients`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| recipe_id | uuid | FK para recipes |
| ingredient_id | uuid | FK para ingredients |
| quantity_needed | numeric | Quantidade usada na receita |

### `sales`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| restaurant_id | uuid | Multi-tenant |
| recipe_id | uuid | FK para recipes |
| quantity_sold | numeric | Quantidade vendida |
| unit_price | numeric | Preço unitário no momento da venda |
| total_value | numeric | quantity_sold × unit_price |
| sold_at | timestamptz | Momento da venda |

---

## 🔐 Autenticação

- `AuthContext.tsx` expõe: `session`, `user`, `signOut`, `isLoading`
- Hook: `useAuth()` disponível em qualquer componente
- `PrivateRoute` em `App.tsx` redireciona para `/login` se não há sessão
- Páginas públicas: `/login`, `/register`, `/reset-password`, `/update-password`
- Todas as demais rotas ficam dentro do `Layout` (sidebar + header)

---

## 📄 Páginas — O que cada uma faz

### Dashboard (`/`)
- KPIs: CMV do mês, Receita do mês, Alertas de estoque
- Top 5 produtos por margem (preço - custo)
- CMV colorido: verde <30%, amarelo 30–40%, vermelho >40%
- Dados calculados em tempo real do Supabase

### Fichas Técnicas (`/recipes`)
- CRUD completo de receitas
- Modal para editar composição (adicionar/remover ingredientes)
- Calcula custo total e CMV automaticamente por ficha
- Filtro por categoria + busca por nome
- Seleção múltipla para exclusão em lote

### Insumos e Estoque (`/ingredients`)
- CRUD completo de ingredientes
- Tabs por tipo: Todos / Insumos / Preparos Base / Bebidas
- Entrada de estoque (adicionar quantidade)
- Alerta visual quando estoque ≤ 0 (texto vermelho)
- Excel Importer integrado (download template + upload)

### Vendas e Entradas (`/sales`)
- Registrar nova venda: seleciona receita, informa quantidade
- Preço unitário auto-preenchido da ficha técnica
- **Baixa automática no estoque** de todos os ingredientes da receita vendida
- Histórico com filtro: Hoje / Semana / Mês
- Total de receita exibido no filtro ativo

### Excel Importer (componente dentro de `/ingredients`)
- Download de template Excel com exemplos
- Upload e parsing de múltiplas abas: Insumos, Preparos, Bebidas, Lanches, Porções, Sobremesas, Combos
- Valida headers, pula duplicatas, parseia números com vírgula
- Log visual estilo terminal com emojis

---

## 🎨 Design System

**Cores principais:**
- Azul primário: `#2563eb` / `blue-600`
- Slate escuro (sidebar): `#0f172a` / `slate-900`
- Verde sucesso: `#16a34a`
- Âmbar aviso: `#d97706`
- Vermelho perigo: `#dc2626`

**Componentes padrão:**
- Cards: `bg-white border border-slate-200 rounded-2xl shadow-sm`
- Botão primário: `bg-blue-600 hover:bg-blue-700 text-white rounded-lg`
- Botão perigo: `bg-red-600 hover:bg-red-700 text-white`
- Inputs: `bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500`
- Modais: overlay `bg-black/60`, conteúdo `bg-white rounded-2xl`
- Badges de categoria: coloridos por tipo

---

## ✅ O que está pronto (MVP funcional)

- [x] Autenticação completa (login, registro, reset de senha)
- [x] Dashboard com KPIs reais do banco
- [x] CRUD de Fichas Técnicas com cálculo de CMV
- [x] CRUD de Insumos com controle de estoque
- [x] Módulo de Vendas com baixa automática de estoque
- [x] Importador Excel (template + upload + parsing)
- [x] Layout responsivo (sidebar desktop, mobile parcial)
- [x] Multi-tenant por restaurant_id

---

## 🚧 O que fazer a seguir (Plano de Ação acordado)

### Fase C — Edição inline de Insumos + Custo Médio (PRIORIDADE IMEDIATA)

**Por que é crítico:** O custo dos insumos muda toda semana. Se `avg_cost_per_unit` não estiver atualizado, o CMV das fichas é impreciso.

**Tarefas:**
1. Edição inline ou modal de insumos — permitir alterar nome, custo, unidade sem deletar
2. Ao atualizar `avg_cost_per_unit`, todas as fichas técnicas que usam aquele insumo recalculam o CMV automaticamente (já acontece via query — só precisa da edição)
3. (Opcional) Entrada de estoque por compra: ao receber mercadoria, atualizar custo médio ponderado

### Fase B — Módulo de Relatórios / Dashboard avançado

**Por que vem depois do C:** Com custos atualizados, o CMV passa a ser confiável.

**Tarefas:**
1. Gráfico de CMV ao longo do tempo (por semana/mês)
2. Relatório de vendas por produto (quantidade × receita × CMV)
3. Alertas proativos: insumos com estoque crítico, CMV acima do limite
4. Exportação de relatório para Excel/PDF

### Pendências técnicas menores
- Menu mobile (hamburger) — sidebar não abre em celular
- Substituir `alert()` por toasts/notificações visuais melhores
- Paginação nas tabelas (atualmente carrega tudo)

---

## 🧠 Decisões de design importantes

1. **Multi-tenancy via `restaurant_id`** — cada query filtra pelo restaurant_id do usuário logado, buscado via join com `profiles`
2. **CMV calculado no frontend** — não há função SQL; o React busca ingredientes + vendas e calcula `(food_cost / revenue) * 100`
3. **Baixa de estoque síncrona** — ao registrar venda, faz N updates (um por ingrediente da receita) em sequência com `Promise.all`
4. **Template Excel fixo** — estrutura definida em `tocsTemplate.ts`, com abas e colunas esperadas hard-coded
5. **Sem ORM** — queries diretas via Supabase JS client (`.from('table').select().eq('restaurant_id', id)`)

---

## 📌 Convenções de código

- Componentes: PascalCase, arquivos `.tsx`
- Hooks: `use` prefix, dentro do componente ou em `contexts/`
- Variáveis de estado: `const [foo, setFoo] = useState()`
- Fetching: `useEffect` + função `async` local (sem React Query)
- Erros: `try/catch` com `alert()` (a melhorar)
- IDs de usuário/restaurante: buscados via `useAuth()` + query em `profiles`

---

*Gerado automaticamente em 2026-03-26. Atualizar sempre que novas features forem implementadas.*
