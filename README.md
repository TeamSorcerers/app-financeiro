# 💰 App Financeiro - Ferramenta de Despesas Colaborativa

Uma aplicação moderna para controle de despesas pessoais e colaborativas, desenvolvida como projeto universitário. A ferramenta permite que amigos e familiares compartilhem e atualizem suas finanças em tempo real.

## 🚀 Visão do Projeto

Este projeto será desenvolvido em múltiplos MVPs, começando com um controle pessoal básico e evoluindo para funcionalidades colaborativas avançadas.

### MVP 1 - Controle Pessoal Básico (Atual)
- ✅ Cadastro e autenticação de usuários
- ✅ Registro de despesas pessoais
- ✅ Categorização de despesas
- ✅ Listagem e visualização de despesas
- ✅ Relatórios básicos mensais

### Próximos MVPs
- 📋 Grupos colaborativos
- 🔄 Atualizações em tempo real (Socket.IO)
- 📊 Relatórios avançados
- 💡 Insights e sugestões

## 🛠️ Tecnologias Utilizadas

### Frontend
- **Next.js 15** - Framework React com App Router
- **React 19** - Biblioteca para interfaces de usuário
- **TypeScript** - Tipagem estática
- **Tailwind CSS v4** - Framework CSS utilitário
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de esquemas

### Backend & Database
- **Prisma** - ORM para banco de dados
- **Auth.js (NextAuth.js)** - Autenticação completa
- **Socket.IO** - Comunicação em tempo real (futuros MVPs)

### Desenvolvimento
- **Pino + Pino-Pretty** - Sistema de logging
- **ESLint** - Linting e formatação de código
- **TypeScript** - Tipagem em todo o projeto

## 📋 Pré-requisitos

- Node.js 18+ 
- npm, yarn, pnpm ou bun
- Banco de dados (PostgreSQL, MySQL ou SQLite)

## 🔧 Instalação e Configuração

### 1. Clone o repositório
```bash
git clone https://github.com/TeamSorcerers/app-financeiro.git
cd app-financeiro
```

### 2. Instale as dependências
```bash
npm install
# ou
yarn install
# ou
pnpm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo `.default.env` para `.env.local`:

```bash
cp .default.env .env.local
```

Configure as seguintes variáveis no `.env.local`:

```env
# Banco de Dados
DATABASE_URL="postgresql://usuario:senha@localhost:5432/app_financeiro"

# Autenticação
AUTH_SECRET="sua-chave-secreta-muito-segura-aqui"
AUTH_TRUST_HOST=true

# Aplicação
APP_ENV="development"
APP_PORT=3001

# Cliente (Next.js)
NEXT_PUBLIC_API_BASE_URL="/api"
NEXT_PUBLIC_APP_SUBFOLDER=""
```

### 4. Configure o banco de dados

```bash
# Gere o cliente Prisma
npx prisma generate

# Execute as migrações
npx prisma migrate dev

# (Opcional) Popule com dados iniciais
npx prisma db seed
```

### 5. Execute o projeto

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

## 📁 Estrutura do Projeto

```
app-financeiro/
├── src/
│   ├── app/                    # App Router (Next.js 13+)
│   │   ├── api/               # API Routes
│   │   │   └── auth/          # Rotas de autenticação
│   │   ├── dashboard/         # Dashboard principal
│   │   ├── expenses/          # Gestão de despesas
│   │   └── layout.tsx         # Layout principal
│   ├── components/            # Componentes reutilizáveis
│   │   ├── ui/               # Componentes de UI básicos
│   │   └── forms/            # Componentes de formulários
│   ├── lib/                  # Utilitários e configurações
│   │   ├── client/          # Utilitários do frontend
│   │   ├── server/          # Utilitários do backend
│   │   └── shared/          # Código compartilhado
│   │       └── validations/ # Esquemas Zod
│   └── types/                # Definições de tipos TypeScript
├── prisma/
│   ├── schema.prisma         # Schema do banco de dados
│   └── migrations/           # Migrações do banco
├── public/                   # Arquivos estáticos
└── docs/                     # Documentação
```

## 🗄️ Banco de Dados

### Entidades Principais

- **User**: Informações do usuário
- **Expense**: Registro de despesas
- **Category**: Categorias pré-definidas

### Comandos Úteis do Prisma

```bash
# Visualizar o banco de dados
npx prisma studio

# Resetar o banco de dados
npx prisma migrate reset

# Aplicar mudanças no schema
npx prisma db push

# Gerar tipos TypeScript
npx prisma generate
```

## 🔐 Autenticação

O projeto utiliza Auth.js (NextAuth.js) para autenticação completa com:

- 📧 Login com email/senha
- 🔒 Sessões seguras
- 🛡️ Proteção de rotas
- 🔄 Renovação automática de tokens

### Rotas de Autenticação

- `GET/POST /api/auth/signin` - Página de login
- `GET/POST /api/auth/signout` - Logout
- `GET /api/auth/session` - Informações da sessão atual
- `GET /api/auth/providers` - Provedores disponíveis

## 🎨 Estilização

### Tailwind CSS v4

O projeto utiliza a versão mais recente do Tailwind CSS com:

- ⚡ Compilação otimizada
- 🎨 Design system consistente
- 📱 Design responsivo
- 🌙 Suporte a tema escuro (futuro)

### Componentes UI

Componentes base localizados em `src/components/ui/` seguindo padrões de acessibilidade.

## 📊 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento

# Produção
npm run build        # Build para produção
npm run start        # Inicia servidor de produção

# Qualidade de Código
npm run lint         # Executa ESLint
npm run type-check   # Verifica tipos TypeScript

# Banco de Dados
npm run db:migrate   # Executa migrações
npm run db:studio    # Abre Prisma Studio
npm run db:seed      # Popula banco com dados iniciais
```

## 🤝 Como Contribuir

1. **Fork** o projeto
2. Crie uma **branch** para sua feature (`git checkout -b feature/nova-feature`)
3. **Commit** suas mudanças (`git commit -m 'Add: nova feature'`)
4. **Push** para a branch (`git push origin feature/nova-feature`)
5. Abra um **Pull Request**

### Padrões de Commit

- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Atualização de documentação
- `style:` - Formatação de código
- `refactor:` - Refatoração de código
- `test:` - Adição de testes

## 🐛 Debugging

### Logs

O projeto utiliza Pino para logging estruturado:

```typescript
import { logger } from '@/lib/server/logger'

logger.info('Informação importante')
logger.error('Erro crítico', { error })
logger.debug('Debug detalhado')
```

### Prisma Studio

Para visualizar e editar dados:

```bash
npx prisma studio
```

## 📚 Documentação Adicional

- 📖 [Documentação Técnica](./DOCS.md)
- 🗃️ [Schema do Banco](./prisma/schema.prisma)
- 🛣️ [Rotas da API](./docs/api-routes.md)

## 📞 Suporte

Para dúvidas ou problemas:

1. Verifique a [documentação](./DOCS.md)
2. Procure em [Issues existentes](../../issues)
3. Abra uma nova [Issue](../../issues/new)

## 📄 Licença

Este projeto é desenvolvido para fins acadêmicos como trabalho universitário.

---

**Desenvolvido com ❤️ para disciplina de Desenvolvimento Web**
