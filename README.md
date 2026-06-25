# Floricultura — Sistema de Gestão

App mobile-first para gestão de estoque e vendedores. Stack: **Next.js 14 + Supabase + Tailwind**.

---

## Setup em 5 passos

### 1. Clonar e instalar dependências

```bash
git clone <seu-repo>
cd floricultura
npm install
```

---

### 2. Configurar o Supabase

**Criar o projeto:**
1. Acesse [supabase.com](https://supabase.com) → New project
2. Anote a **Project URL** e a **anon public key** (Settings → API)

**Rodar o schema:**
1. No painel Supabase → SQL Editor → New query
2. Cole o conteúdo de `supabase/schema.sql`
3. Execute (Run)

**Criar o primeiro usuário:**
1. Authentication → Users → Add user
2. Preencha e-mail e senha — essas credenciais são usadas na tela de login

---

### 3. Variáveis de ambiente (local)

Copie o arquivo de exemplo:

```bash
cp .env.local.example .env.local
```

Edite `.env.local` com os valores do seu projeto Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 4. Rodar localmente

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) → redireciona para `/login`.

---

### 5. Deploy na Vercel

```bash
# Instale a CLI da Vercel (se não tiver)
npm i -g vercel

# Deploy
vercel
```

**Ou via dashboard:**
1. [vercel.com/new](https://vercel.com/new) → Import Git Repository
2. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy

---

## Estrutura do projeto

```
floricultura/
├── app/
│   ├── login/page.tsx     # Tela de login
│   ├── page.tsx           # App principal (protegido)
│   ├── layout.tsx         # Root layout
│   └── globals.css
├── lib/
│   └── supabase.ts        # Client helper
├── supabase/
│   └── schema.sql         # Schema + RLS + triggers
├── middleware.ts           # Proteção de rotas
└── .env.local.example
```

---

## Segurança

- **Row Level Security (RLS)** ativo em todas as tabelas — cada usuário só acessa seus próprios dados.
- **Preço travado**: o preço do produto é registrado no momento da alocação. Reajustes futuros não afetam acertos em aberto.
- **Middleware**: rotas desprotegidas redirecionam para `/login` automaticamente.

---

## Adicionando mais usuários

No painel Supabase → Authentication → Users → Invite user.

Cada usuário terá seu próprio conjunto isolado de produtos, vendedores, alocações e acertos.
