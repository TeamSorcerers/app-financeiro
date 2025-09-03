# 📖 Documentação Técnica - App Financeiro

## 🏗️ Arquitetura do Sistema

O App Financeiro é construído utilizando uma arquitetura moderna baseada no Next.js 15 com App Router, seguindo princípios de desenvolvimento clean code e separation of concerns.

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT SIDE                           │
├─────────────────────────────────────────────────────────────┤
│  Next.js App Router (React 19 + TypeScript)               │
│  ├── Pages & Layouts                                       │
│  ├── Components (UI + Forms)                               │
│  ├── Hooks & Context                                       │
│  └── Utils & Validations (Zod)                            │
├─────────────────────────────────────────────────────────────┤
│                      SERVER SIDE                           │
├─────────────────────────────────────────────────────────────┤
│  API Routes (Next.js)                                      │
│  ├── Auth.js Routes (/api/auth/*)                         │
│  ├── Expenses API (/api/expenses/*)                       │
│  ├── Categories API (/api/categories/*)                   │
│  └── Reports API (/api/reports/*)                         │
├─────────────────────────────────────────────────────────────┤
│                      DATABASE                              │
├─────────────────────────────────────────────────────────────┤
│  Prisma ORM + PostgreSQL/MySQL                            │
│  ├── Users Table                                           │
│  ├── Expenses Table                                        │
│  └── Categories Table                                      │
└─────────────────────────────────────────────────────────────┘
```

## 🗂️ Estrutura Detalhada de Arquivos

```
app-financeiro/
├── src/
│   ├── app/                           # App Router do Next.js 15
│   │   ├── (auth)/                   # Grupo de rotas de autenticação
│   │   │   ├── login/                # Página de login
│   │   │   └── register/             # Página de registro
│   │   ├── dashboard/                # Dashboard principal
│   │   │   ├── page.tsx             # Página do dashboard
│   │   │   └── loading.tsx          # Loading UI
│   │   ├── expenses/                 # Gestão de despesas
│   │   │   ├── page.tsx             # Listagem de despesas
│   │   │   ├── add/                 # Adicionar despesa
│   │   │   └── [id]/                # Detalhes/edição de despesa
│   │   ├── api/                      # API Routes
│   │   │   ├── auth/                # Rotas Auth.js
│   │   │   │   └── [...nextauth]/   # Configuração Auth.js
│   │   │   ├── expenses/            # CRUD de despesas
│   │   │   ├── categories/          # Listagem de categorias
│   │   │   └── reports/             # Relatórios
│   │   ├── globals.css              # Estilos globais
│   │   ├── layout.tsx               # Layout raiz
│   │   ├── page.tsx                 # Página inicial
│   │   ├── loading.tsx              # Loading global
│   │   └── error.tsx                # Error boundary
│   ├── components/                   # Componentes reutilizáveis
│   │   ├── ui/                      # Componentes base de UI
│   │   │   ├── button.tsx           # Componente de botão
│   │   │   ├── input.tsx            # Componente de input
│   │   │   ├── card.tsx             # Componente de card
│   │   │   └── modal.tsx            # Componente de modal
│   │   ├── forms/                   # Componentes de formulários
│   │   │   ├── expense-form.tsx     # Formulário de despesas
│   │   │   ├── login-form.tsx       # Formulário de login
│   │   │   └── register-form.tsx    # Formulário de registro
│   │   ├── layout/                  # Componentes de layout
│   │   │   ├── header.tsx           # Cabeçalho
│   │   │   ├── sidebar.tsx          # Barra lateral
│   │   │   └── footer.tsx           # Rodapé
│   │   └── providers/               # Context providers
│   │       └── auth-provider.tsx    # Provider de autenticação
│   ├── lib/                         # Utilitários e configurações
│   │   ├── client/                 # Utilitários do frontend
│   │   │   ├── hooks/             # Custom hooks React
│   │   │   ├── utils.ts           # Funções utilitárias do cliente
│   │   │   └── api-client.ts      # Cliente para requisições API
│   │   ├── server/                # Utilitários do backend
│   │   │   ├── auth.ts            # Configuração Auth.js
│   │   │   ├── prisma.ts          # Cliente Prisma
│   │   │   └── logger.ts          # Configuração Pino
│   │   └── shared/                # Utilitários compartilhados
│   │       ├── validations/       # Esquemas Zod
│   │       │   ├── auth.ts        # Validações de autenticação
│   │       │   ├── expense.ts     # Validações de despesas
│   │       │   └── common.ts      # Validações comuns
│   │       ├── types/             # Tipos TypeScript compartilhados
│   │       ├── constants.ts       # Constantes da aplicação
│   │       └── utils.ts           # Funções utilitárias compartilhadas
│   ├── types/                       # Definições de tipos
│   │   ├── auth.ts                  # Tipos de autenticação
│   │   ├── expense.ts               # Tipos de despesas
│   │   └── database.ts              # Tipos do banco de dados
│   └── styles/                      # Estilos adicionais
├── prisma/                          # Configuração do banco
│   ├── schema.prisma                # Schema do banco
│   ├── migrations/                  # Migrações
│   └── seed.ts                      # Dados iniciais
├── public/                          # Arquivos estáticos
├── docs/                            # Documentação adicional
├── .env.local                       # Variáveis de ambiente
├── .default.env                     # Template de variáveis
├── package.json                     # Dependências
├── tsconfig.json                    # Configuração TypeScript
├── tailwind.config.ts               # Configuração Tailwind
├── eslint.config.mjs               # Configuração ESLint
└── next.config.mjs                  # Configuração Next.js
```

## 🛣️ Rotas da API

### Autenticação (Auth.js)

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET/POST` | `/api/auth/signin` | Página/processo de login |
| `GET/POST` | `/api/auth/signout` | Processo de logout |
| `GET` | `/api/auth/session` | Obter sessão atual |
| `GET` | `/api/auth/providers` | Listar provedores de auth |
| `GET` | `/api/auth/csrf` | Token CSRF |

### Despesas

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/expenses` | Listar despesas do usuário |
| `POST` | `/api/expenses` | Criar nova despesa |
| `GET` | `/api/expenses/[id]` | Obter despesa específica |
| `PUT` | `/api/expenses/[id]` | Atualizar despesa |
| `DELETE` | `/api/expenses/[id]` | Deletar despesa |

### Categorias

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/categories` | Listar todas as categorias |

### Relatórios

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/reports/monthly` | Relatório mensal |
| `GET` | `/api/reports/yearly` | Relatório anual |

## 🗃️ Schema do Banco de Dados

### Modelo de Dados (Prisma Schema)

```prisma
// User Model
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  expenses  Expense[]
  
  @@map("users")
}

// Category Model
model Category {
  id          String   @id @default(cuid())
  name        String   @unique
  icon        String?
  color       String?
  description String?
  createdAt   DateTime @default(now())
  
  expenses    Expense[]
  
  @@map("categories")
}

// Expense Model
model Expense {
  id          String   @id @default(cuid())
  description String
  amount      Decimal  @db.Decimal(10, 2)
  date        DateTime
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id])
  
  @@map("expenses")
}
```

### Relacionamentos

- **User → Expense**: 1:N (Um usuário pode ter muitas despesas)
- **Category → Expense**: 1:N (Uma categoria pode ter muitas despesas)

## � Organização da Pasta `lib/`

A pasta `src/lib/` é organizada em três subpastas principais que separam claramente as responsabilidades entre frontend, backend e código compartilhado:

### 📱 `client/` - Frontend Only
Contém utilitários e serviços que executam exclusivamente no navegador:

```
src/lib/client/
├── hooks/                     # Custom hooks React
│   ├── use-auth.ts           # Hook de autenticação
│   ├── use-expenses.ts       # Hook para gestão de despesas
│   └── use-debounce.ts       # Hook de debounce
├── api-client.ts             # Cliente para requisições HTTP
├── storage.ts                # LocalStorage/SessionStorage utils
├── format.ts                 # Formatação de dados para UI
└── utils.ts                  # Utilitários específicos do cliente
```

### 🔧 `server/` - Backend Only
Contém configurações e utilitários que executam apenas no servidor:

```
src/lib/server/
├── auth.ts                   # Configuração Auth.js
├── prisma.ts                 # Cliente Prisma
├── logger.ts                 # Configuração Pino
├── middleware.ts             # Middlewares de API
├── email.ts                  # Serviço de email
└── crypto.ts                 # Funções de criptografia
```

### 🔄 `shared/` - Compartilhado
Contém código que pode ser usado tanto no frontend quanto no backend:

```
src/lib/shared/
├── validations/              # Esquemas Zod
│   ├── auth.ts              # Validações de autenticação
│   ├── expense.ts           # Validações de despesas
│   └── common.ts            # Validações comuns
├── types/                   # Tipos TypeScript
│   ├── auth.ts             # Tipos de autenticação
│   ├── expense.ts          # Tipos de despesas
│   └── api.ts              # Tipos de API
├── constants.ts             # Constantes da aplicação
├── utils.ts                 # Funções utilitárias compartilhadas
└── errors.ts                # Classes de erro customizadas
```

### Exemplo de Uso

```typescript
// No cliente (React component)
import { useAuth } from '@/lib/client/hooks/use-auth'
import { formatCurrency } from '@/lib/client/format'

// No servidor (API route)
import { logger } from '@/lib/server/logger'
import { prisma } from '@/lib/server/prisma'

// Compartilhado (cliente e servidor)
import { createExpenseSchema } from '@/lib/shared/validations/expense'
import { ExpenseType } from '@/lib/shared/types/expense'
```

## �🔐 Configuração de Autenticação

### Auth.js Setup

```typescript
// src/lib/server/auth.ts
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      return session
    }
  }
})
```

### Middleware de Proteção

```typescript
// middleware.ts
import { auth } from "@/lib/server/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  const isAuthRoute = nextUrl.pathname.startsWith("/login") || 
                     nextUrl.pathname.startsWith("/register")
  const isProtectedRoute = nextUrl.pathname.startsWith("/dashboard") ||
                          nextUrl.pathname.startsWith("/expenses")

  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl))
    }
    return NextResponse.next()
  }

  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
}
```

## 📝 Validações com Zod

### Esquemas de Validação

```typescript
// src/lib/shared/validations/expense.ts
import { z } from "zod"

export const createExpenseSchema = z.object({
  description: z.string()
    .min(1, "Descrição é obrigatória")
    .max(255, "Descrição muito longa"),
  amount: z.number()
    .positive("Valor deve ser positivo")
    .max(999999.99, "Valor muito alto"),
  date: z.date()
    .max(new Date(), "Data não pode ser futura"),
  categoryId: z.string()
    .min(1, "Categoria é obrigatória")
})

export const updateExpenseSchema = createExpenseSchema.partial()

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>
```

```typescript
// src/lib/shared/validations/auth.ts
import { z } from "zod"

export const loginSchema = z.object({
  email: z.string()
    .email("Email inválido")
    .min(1, "Email é obrigatório"),
  password: z.string()
    .min(6, "Senha deve ter pelo menos 6 caracteres")
})

export const registerSchema = z.object({
  name: z.string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(50, "Nome muito longo"),
  email: z.string()
    .email("Email inválido")
    .min(1, "Email é obrigatório"),
  password: z.string()
    .min(6, "Senha deve ter pelo menos 6 caracteres")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
           "Senha deve conter pelo menos uma letra maiúscula, minúscula e um número")
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
```

## 🎨 Sistema de Design com Tailwind

### Configuração do Tailwind CSS v4

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        },
        danger: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        }
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)'],
        mono: ['var(--font-geist-mono)'],
      }
    }
  },
  plugins: []
}

export default config
```

### Design Tokens

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  
  /* Border Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}

@layer components {
  .btn-primary {
    @apply bg-primary-600 text-white px-4 py-2 rounded-md 
           hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 
           focus:ring-offset-2 transition-colors;
  }
  
  .btn-secondary {
    @apply bg-gray-200 text-gray-900 px-4 py-2 rounded-md 
           hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 
           focus:ring-offset-2 transition-colors;
  }
  
  .card {
    @apply bg-white rounded-lg shadow-md p-6 border border-gray-200;
  }
  
  .input {
    @apply w-full px-3 py-2 border border-gray-300 rounded-md 
           focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
           transition-colors;
  }
}
```

## 📊 Logging com Pino

### Configuração do Logger

```typescript
// src/lib/server/logger.ts
import pino from 'pino'

const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname'
      }
    }
  })
})

// Wrapper para API routes
export const apiLogger = logger.child({ module: 'api' })
export const authLogger = logger.child({ module: 'auth' })
export const dbLogger = logger.child({ module: 'database' })
```

### Uso do Logger

```typescript
// Exemplo em API route
import { apiLogger } from '@/lib/server/logger'

export async function GET(request: Request) {
  try {
    apiLogger.info('Fetching expenses for user', { userId })
    
    const expenses = await prisma.expense.findMany({
      where: { userId }
    })
    
    apiLogger.info('Expenses fetched successfully', { 
      count: expenses.length,
      userId 
    })
    
    return Response.json(expenses)
  } catch (error) {
    apiLogger.error('Failed to fetch expenses', { 
      error: error.message,
      userId 
    })
    
    return Response.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
```

## 🔄 Ciclo de Desenvolvimento

### Scripts NPM

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build --turbopack",
    "start": "next start",
    "lint": "eslint",
    "lint:fix": "eslint --fix",
    "type-check": "tsc --noEmit",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts",
    "db:reset": "prisma migrate reset",
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

### Workflow de Desenvolvimento

1. **Setup Inicial**
   ```bash
   npm install
   cp .default.env .env.local
   # Configurar variáveis de ambiente
   npm run db:migrate
   npm run db:seed
   ```

2. **Desenvolvimento**
   ```bash
   npm run dev          # Inicia servidor de desenvolvimento
   npm run db:studio    # Visualizar banco de dados
   npm run lint         # Verificar código
   ```

3. **Antes de Commit**
   ```bash
   npm run type-check   # Verificar tipos
   npm run lint:fix     # Corrigir lint automaticamente
   npm test             # Executar testes
   ```

4. **Deploy**
   ```bash
   npm run build        # Build de produção
   npm run start        # Testar build localmente
   ```

## 📈 Próximas Implementações

### MVP 2 - Grupos Colaborativos
- Criação e gestão de grupos
- Convites para participantes
- Despesas compartilhadas
- Divisão automática de custos

### MVP 3 - Tempo Real
- Integração com Socket.IO
- Atualizações em tempo real
- Notificações push
- Sincronização automática

### MVP 4 - Analytics Avançado
- Relatórios detalhados
- Gráficos interativos
- Insights com IA
- Exportação de dados

## 🔧 Troubleshooting

### Problemas Comuns

1. **Erro de Conexão com Banco**
   - Verificar `DATABASE_URL` no `.env.local`
   - Executar `npm run db:migrate`
   - Verificar se o banco está rodando

2. **Erro de Autenticação**
   - Verificar `AUTH_SECRET` no `.env.local`
   - Limpar cookies do navegador
   - Verificar configuração do Auth.js

3. **Erro de Build**
   - Executar `npm run type-check`
   - Verificar imports e exports
   - Limpar cache: `rm -rf .next`

### Logs Úteis

```bash
# Ver logs do Prisma
DEBUG="prisma*" npm run dev

# Ver logs detalhados do Next.js
DEBUG="*" npm run dev

# Ver apenas logs da aplicação
LOG_LEVEL="debug" npm run dev
```