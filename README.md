# 🐾 TOGO - Sistema de Gestão Veterinária

![TOGO Logo](src/assets/husky-icon.png)

Sistema completo de gestão para clínicas veterinárias, desenvolvido com tecnologias modernas e foco em experiência do usuário.

---

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Arquitetura](#arquitetura)
- [Instalação](#instalação)
- [Uso](#uso)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Documentação Técnica](#documentação-técnica)
- [Contribuindo](#contribuindo)
- [Licença](#licença)

---

## 🎯 Sobre o Projeto

**TOGO** é um sistema de gestão veterinária completo que permite a administração eficiente de clínicas veterinárias, incluindo:

- Gerenciamento de clientes e pets
- Controle de agendamentos e atendimentos
- Gestão de vacinas e prontuários
- Controle de estoque de produtos
- Ponto de Venda (PDV)
- Gestão financeira
- Relatórios gerenciais
- Sistema de autenticação seguro
- Temas claro/escuro

O sistema foi projetado com foco em usabilidade, responsividade e performance, oferecendo uma interface moderna e intuitiva para profissionais veterinários.

---

## ✨ Funcionalidades

### 🏠 Dashboard
- **Visão geral da clínica**: Métricas em tempo real
- **Agendamentos**: Contador de agendamentos do dia e da semana
- **Faturamento**: Análise financeira diária e mensal (30 dias)
- **Clientes e Pets**: Total de cadastros ativos
- **Alertas**: Produtos com estoque baixo
- **Taxa de ocupação**: Análise semanal de aproveitamento
- **Vacinas pendentes**: Lembretes para próximos 7 dias
- **Fila de espera**: Gerenciamento de atendimentos em tempo real
  - Status personalizáveis (Aguardando, Liberado, Concluído, Outros)
  - Visualização de prontuários
  - Dados de triagem
  - Resumo financeiro
  - Edição de atendimentos

### 👥 Gestão de Clientes
- Cadastro completo de clientes
- Histórico de atendimentos
- Dados de contato (telefone, email, CPF/CNPJ)
- Gerenciamento de múltiplos pets por cliente

### 🐕 Gestão de Pets
- Cadastro detalhado de animais
- Informações: espécie, raça, sexo, cor, data de nascimento
- Status de castração
- Vínculo com proprietários
- Histórico médico completo

### 📅 Agenda
- Calendário de agendamentos
- Visualização por dia/semana/mês
- Associação com clientes, pets e serviços
- Definição de profissional responsável
- Controle de horários (início/fim)
- Status de agendamento (agendado, em andamento, concluído, cancelado, faltou)

### 🩺 Atendimentos
- Registro de consultas e procedimentos
- Tipos de serviço:
  - Consultas
  - Cirurgias
  - Exames
  - Banho e tosa
  - Hospedagem
- Prontuário eletrônico
- Notas de atendimento
- Vínculo com agendamentos

### 💉 Gestão de Vacinas
- Cadastro de vacinas (fabricante, doses, intervalo)
- Controle de vacinação
- Registro de aplicações:
  - Data de aplicação
  - Dose aplicada
  - Próxima data
  - Lote do produto
  - Profissional aplicador
- Alertas de vacinas pendentes

### 📦 Gestão de Produtos
- Cadastro de produtos
- SKU único
- Categorias (Medicamentos, Rações, Acessórios, Higiene)
- Controle de estoque:
  - Estoque atual
  - Estoque mínimo
  - Alertas de baixo estoque
- Gestão de preços:
  - Preço de custo
  - Preço de venda
- Status (ativo/inativo)

### 🛒 PDV (Ponto de Venda)
- Sistema de caixa
- Vendas de produtos e serviços
- Múltiplos itens por venda
- Controle de pagamentos:
  - Métodos: PIX, dinheiro, cartão de crédito/débito
  - Status de aprovação
- Cálculo automático de totais:
  - Total bruto
  - Descontos
  - Total líquido
- Histórico de vendas

### 💰 Financeiro
- Fluxo de caixa
- Controle de receitas e despesas
- Relatórios financeiros
- Análise de faturamento

### 📊 Relatórios
- Relatórios gerenciais
- Análises estatísticas
- Exportação de dados
- Indicadores de performance

### ⚙️ Configurações
- Configuração do sistema
- Alternância de tema (claro/escuro)
- Personalização da interface
- Gerenciamento de perfil

### 🔐 Autenticação
- Sistema de login seguro
- Cadastro de novos usuários
- Recuperação de senha
- Proteção de rotas
- Sessões persistentes
- Gerenciamento de perfis de usuário

---

## 🚀 Tecnologias Utilizadas

### Frontend
- **React 18.3.1**: Biblioteca para construção de interfaces
- **TypeScript**: Superset JavaScript com tipagem estática
- **Vite**: Build tool e dev server de alta performance
- **React Router DOM 6.30.1**: Roteamento de páginas

### UI/UX
- **Tailwind CSS**: Framework CSS utilitário
- **shadcn/ui**: Componentes React reutilizáveis e acessíveis
- **Radix UI**: Primitivas de componentes acessíveis
- **Lucide React**: Ícones SVG otimizados
- **next-themes**: Gerenciamento de temas (claro/escuro)
- **class-variance-authority**: Gerenciamento de variantes de componentes
- **tailwind-merge**: Mesclagem inteligente de classes Tailwind
- **tailwindcss-animate**: Animações predefinidas

### Formulários e Validação
- **React Hook Form 7.61.1**: Gerenciamento de formulários performático
- **Zod 3.25.76**: Validação de schemas TypeScript-first
- **@hookform/resolvers**: Integração de validadores com React Hook Form

### Backend (Lovable Cloud / Supabase)
- **@supabase/supabase-js 2.77.0**: Cliente JavaScript do Supabase
- **PostgreSQL**: Banco de dados relacional
- **Row Level Security (RLS)**: Segurança a nível de linha
- **Funções do banco**: Lógica de negócio no servidor

### Gestão de Estado
- **@tanstack/react-query 5.83.0**: Gerenciamento de estado assíncrono
- **React Context API**: Contexto de autenticação

### Data e Formatação
- **date-fns 3.6.0**: Manipulação e formatação de datas
- **react-day-picker 8.10.1**: Seletor de datas

### Componentes Avançados
- **recharts 2.15.4**: Biblioteca de gráficos
- **embla-carousel-react 8.6.0**: Carrossel responsivo
- **sonner 1.7.4**: Sistema de notificações toast
- **vaul 0.9.9**: Drawer component
- **cmdk 1.1.1**: Command menu
- **input-otp 1.4.2**: Input de código OTP

### Desenvolvimento
- **ESLint**: Linter de código
- **TypeScript Config**: Configuração de tipos
- **PostCSS**: Processador de CSS
- **Lovable Tagger**: Ferramenta de desenvolvimento

---

## 🏗️ Arquitetura

### Estrutura de Camadas

```
┌─────────────────────────────────────┐
│     Camada de Apresentação          │
│  (React Components + shadcn/ui)     │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│     Camada de Lógica de Negócio     │
│    (Hooks + Context + Queries)      │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│     Camada de Integração            │
│      (Supabase Client)              │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│     Camada de Dados                 │
│  (PostgreSQL + RLS + Functions)     │
└─────────────────────────────────────┘
```

### Padrões de Design Implementados

1. **Component Composition**: Componentes pequenos e reutilizáveis
2. **Custom Hooks**: Lógica reutilizável encapsulada
3. **Context API**: Gerenciamento de estado global (autenticação)
4. **Protected Routes**: Segurança de rotas
5. **Design System**: Sistema de design consistente com tokens semânticos
6. **Responsive Design**: Layout adaptável a diferentes dispositivos

### Sistema de Design

O projeto implementa um **design system completo** com tokens semânticos HSL:

**Tokens Principais:**
- `--primary`: Cor principal da marca (verde)
- `--secondary`: Cor secundária
- `--accent`: Cor de destaque
- `--success`: Cor de sucesso
- `--warning`: Cor de alerta
- `--destructive`: Cor de erro
- `--muted`: Cores atenuadas
- `--background`: Cor de fundo
- `--foreground`: Cor de texto

**Suporte a Temas:**
- Modo claro
- Modo escuro
- Alternância em tempo real
- Preferência do sistema

---

## 📦 Instalação

### Pré-requisitos
- Node.js (versão 18+)
- npm ou yarn ou bun

### Passos

1. **Clone o repositório**
```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**

O arquivo `.env` é configurado automaticamente pelo Lovable Cloud e contém:
```env
VITE_SUPABASE_URL=<sua-url-supabase>
VITE_SUPABASE_PUBLISHABLE_KEY=<sua-chave-publica>
VITE_SUPABASE_PROJECT_ID=<id-do-projeto>
```

4. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

5. **Acesse a aplicação**
```
http://localhost:8080
```

---

## 🎮 Uso

### Primeiro Acesso

1. **Cadastro**: Acesse a página de autenticação e crie uma conta
2. **Login**: Faça login com suas credenciais
3. **Dados Mock**: O sistema popula automaticamente dados de demonstração
4. **Navegação**: Use o menu lateral para acessar diferentes módulos

### Fluxo de Trabalho Típico

1. **Cadastro de Cliente**: Registre o cliente em Clientes
2. **Cadastro de Pet**: Vincule o pet ao cliente
3. **Agendamento**: Crie um agendamento na Agenda
4. **Atendimento**: Gerencie o atendimento no Dashboard ou Atendimentos
5. **Vacina**: Registre vacinas aplicadas em Vacinas
6. **Venda**: Finalize com venda de produtos/serviços no PDV
7. **Relatórios**: Acompanhe métricas em Relatórios e Financeiro

---

## 📁 Estrutura do Projeto

```
togo/
├── public/                     # Arquivos públicos
│   ├── favicon.png            # Ícone do site
│   └── robots.txt             # Configuração para crawlers
│
├── src/
│   ├── assets/                # Recursos estáticos
│   │   └── husky-icon.png     # Logo do sistema
│   │
│   ├── components/            # Componentes React
│   │   ├── ui/                # Componentes shadcn/ui
│   │   │   ├── accordion.tsx
│   │   │   ├── alert-dialog.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── card.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── toaster.tsx
│   │   │   └── ...            # Outros componentes UI
│   │   │
│   │   ├── AppSidebar.tsx     # Menu lateral da aplicação
│   │   ├── FilaEspera.tsx     # Componente de fila de espera
│   │   ├── Layout.tsx         # Layout principal com sidebar
│   │   └── ProtectedRoute.tsx # HOC para rotas protegidas
│   │
│   ├── contexts/              # Contextos React
│   │   └── AuthContext.tsx    # Contexto de autenticação
│   │
│   ├── hooks/                 # Custom hooks
│   │   ├── use-mobile.tsx     # Detecção de dispositivo móvel
│   │   └── use-toast.ts       # Hook de notificações
│   │
│   ├── integrations/          # Integrações externas
│   │   └── supabase/
│   │       ├── client.ts      # Cliente Supabase (auto-gerado)
│   │       └── types.ts       # Tipos TypeScript do DB (auto-gerado)
│   │
│   ├── lib/                   # Utilitários
│   │   └── utils.ts           # Funções auxiliares
│   │
│   ├── pages/                 # Páginas da aplicação
│   │   ├── Dashboard.tsx      # Página principal com métricas
│   │   ├── Auth.tsx           # Autenticação (login/cadastro)
│   │   ├── Clientes.tsx       # Gestão de clientes
│   │   ├── Pets.tsx           # Gestão de pets
│   │   ├── Agenda.tsx         # Agendamentos
│   │   ├── Atendimentos.tsx   # Consultas e procedimentos
│   │   ├── Vacinas.tsx        # Controle de vacinas
│   │   ├── Produtos.tsx       # Gestão de estoque
│   │   ├── PDV.tsx            # Ponto de venda
│   │   ├── Financeiro.tsx     # Controle financeiro
│   │   ├── Relatorios.tsx     # Relatórios gerenciais
│   │   ├── Config.tsx         # Configurações do sistema
│   │   └── NotFound.tsx       # Página 404
│   │
│   ├── App.tsx                # Componente raiz
│   ├── App.css                # Estilos do App
│   ├── index.css              # Estilos globais + Design System
│   ├── main.tsx               # Entry point
│   └── vite-env.d.ts          # Tipos do Vite
│
├── supabase/                  # Configuração Supabase
│   └── config.toml            # Config do projeto (auto-gerado)
│
├── .env                       # Variáveis de ambiente (auto-gerado)
├── components.json            # Config shadcn/ui
├── eslint.config.js           # Configuração ESLint
├── index.html                 # HTML principal
├── package.json               # Dependências e scripts
├── postcss.config.js          # Config PostCSS
├── tailwind.config.ts         # Configuração Tailwind
├── tsconfig.json              # Config TypeScript
├── vite.config.ts             # Configuração Vite
└── README.md                  # Este arquivo
```

---

## 📚 Documentação Técnica

Consulte [DOCUMENTATION.md](./DOCUMENTATION.md) para documentação técnica detalhada incluindo:

- Arquitetura do banco de dados
- Esquema de tabelas
- Políticas RLS
- Funções do banco
- Fluxos de dados
- APIs e integrações
- Guias de desenvolvimento
- Melhores práticas

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

## 🔗 Links Úteis

- **Projeto Lovable**: https://lovable.dev/projects/204bc5a9-99bc-429a-a418-9bb084115459
- **Documentação Lovable**: https://docs.lovable.dev/
- **Supabase**: https://supabase.com/docs
- **React**: https://react.dev/
- **Tailwind CSS**: https://tailwindcss.com/
- **shadcn/ui**: https://ui.shadcn.com/

---

## 👥 Equipe

Desenvolvido com ❤️ para profissionais veterinários.

---

## 📞 Suporte

Para suporte e dúvidas:
- Abra uma issue no GitHub
- Entre em contato através do Lovable Discord

---

**TOGO** - Gestão Veterinária Inteligente 🐾
