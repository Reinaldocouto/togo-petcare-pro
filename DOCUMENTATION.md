# 📖 Documentação Técnica - TOGO

**Sistema de Gestão Veterinária**

---

## Índice

1. [Arquitetura Geral](#arquitetura-geral)
2. [Banco de Dados](#banco-de-dados)
3. [Autenticação e Segurança](#autenticação-e-segurança)
4. [Frontend](#frontend)
5. [Backend](#backend)
6. [Fluxos de Dados](#fluxos-de-dados)
7. [APIs e Integrações](#apis-e-integrações)
8. [Guia de Desenvolvimento](#guia-de-desenvolvimento)
9. [Deploy](#deploy)
10. [Manutenção](#manutenção)

---

## 1. Arquitetura Geral

### 1.1 Visão Geral

O TOGO é uma aplicação **fullstack** construída com arquitetura **cliente-servidor**:

```
┌──────────────────────────────────────────────────────┐
│                    CLIENTE (SPA)                      │
│                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │   React     │  │  React      │  │  Tailwind   │  │
│  │   Router    │  │  Query      │  │  CSS        │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
│                                                       │
│  ┌──────────────────────────────────────────────┐   │
│  │         shadcn/ui Components                 │   │
│  └──────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
                        ↕ HTTPS
┌──────────────────────────────────────────────────────┐
│              LOVABLE CLOUD / SUPABASE                │
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │   Auth       │  │  PostgreSQL  │  │  Storage  │  │
│  │   System     │  │  Database    │  │  Buckets  │  │
│  └──────────────┘  └──────────────┘  └───────────┘  │
│                                                       │
│  ┌──────────────────────────────────────────────┐   │
│  │         Row Level Security (RLS)             │   │
│  └──────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

### 1.2 Stack Tecnológica

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- React Router DOM (roteamento)
- TanStack Query (cache e sincronização)
- Tailwind CSS + shadcn/ui (UI)
- next-themes (temas)

**Backend:**
- Lovable Cloud (Supabase)
- PostgreSQL (banco de dados)
- Row Level Security (segurança)
- Database Functions (lógica de negócio)

**DevOps:**
- Git (controle de versão)
- Lovable Deploy (CI/CD automático)
- Environment Variables (configuração)

---

## 2. Banco de Dados

### 2.1 Modelo de Dados

#### Diagrama ER Simplificado

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   clinics    │──────<│  locations   │       │   profiles   │
└──────────────┘       └──────────────┘       └──────────────┘
       │                      │                       │
       │                      │                       │
       ├──────────────────────┼───────────────────────┤
       │                      │                       │
       ▼                      ▼                       ▼
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   clients    │──────<│     pets     │       │  user_roles  │
└──────────────┘       └──────────────┘       └──────────────┘
       │                      │
       │                      │
       └──────┬───────────────┘
              │
              ▼
       ┌──────────────┐
       │ appointments │
       └──────────────┘
              │
              ├────────┬────────┬────────┐
              ▼        ▼        ▼        ▼
       ┌─────────┐ ┌──────┐ ┌──────┐ ┌────────┐
       │  sales  │ │ vacc │ │ serv │ │products│
       └─────────┘ │ ines │ │ices │ └────────┘
                   └──────┘ └──────┘
```

### 2.2 Tabelas Principais

#### 2.2.1 Clinics (Clínicas)
```sql
clinics
├── id (UUID, PK)
├── nome (TEXT)
├── cnpj (TEXT, UNIQUE)
├── endereco (TEXT)
├── telefone (TEXT)
├── email (TEXT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

**Descrição**: Armazena informações das clínicas veterinárias.

---

#### 2.2.2 Profiles (Perfis de Usuário)
```sql
profiles
├── id (UUID, PK, FK -> auth.users)
├── nome (TEXT)
├── email (TEXT)
├── telefone (TEXT)
├── avatar_url (TEXT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

**Descrição**: Perfis de usuários vinculados ao sistema de autenticação.

**Trigger**: `handle_new_user()` - Cria automaticamente o perfil quando um usuário se registra.

---

#### 2.2.3 User Roles (Papéis de Usuário)
```sql
user_roles
├── id (UUID, PK)
├── user_id (UUID, FK -> profiles)
├── clinic_id (UUID, FK -> clinics)
├── role (app_role ENUM)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

ENUM app_role: 'admin', 'veterinario', 'atendente', 'gestor'
```

**Descrição**: Controla permissões de usuários em clínicas.

---

#### 2.2.4 Locations (Unidades/Locais)
```sql
locations
├── id (UUID, PK)
├── clinic_id (UUID, FK -> clinics)
├── nome (TEXT)
├── tipo (location_type ENUM)
├── endereco (TEXT)
├── ativo (BOOLEAN)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

ENUM location_type: 'matriz', 'filial'
```

**Descrição**: Diferentes unidades de uma clínica.

---

#### 2.2.5 Clients (Clientes)
```sql
clients
├── id (UUID, PK)
├── clinic_id (UUID, FK -> clinics)
├── nome (TEXT)
├── email (TEXT)
├── telefone (TEXT)
├── cpf_cnpj (TEXT)
├── endereco (TEXT)
├── cidade (TEXT)
├── estado (TEXT)
├── cep (TEXT)
├── observacoes (TEXT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

**Descrição**: Cadastro de clientes (tutores) da clínica.

**Índices**:
- `idx_clients_clinic` em `clinic_id`
- `idx_clients_cpf_cnpj` em `cpf_cnpj`

---

#### 2.2.6 Pets
```sql
pets
├── id (UUID, PK)
├── clinic_id (UUID, FK -> clinics)
├── client_id (UUID, FK -> clients)
├── nome (TEXT)
├── especie (TEXT)
├── raca (TEXT)
├── sexo (TEXT)
├── cor (TEXT)
├── nascimento (DATE)
├── castrado (BOOLEAN)
├── microchip (TEXT)
├── foto_url (TEXT)
├── observacoes (TEXT)
├── ativo (BOOLEAN)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

**Descrição**: Cadastro de animais.

**Índices**:
- `idx_pets_clinic` em `clinic_id`
- `idx_pets_client` em `client_id`

---

#### 2.2.7 Service Types (Tipos de Serviço)
```sql
service_types
├── id (UUID, PK)
├── clinic_id (UUID, FK -> clinics)
├── nome (TEXT)
├── categoria (service_category ENUM)
├── preco_base (NUMERIC)
├── duracao_minutos (INTEGER)
├── descricao (TEXT)
├── ativo (BOOLEAN)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

ENUM service_category: 'consulta', 'cirurgia', 'exame', 'banho', 'tosa', 'hospedagem'
```

**Descrição**: Tipos de serviços oferecidos pela clínica.

---

#### 2.2.8 Appointments (Agendamentos)
```sql
appointments
├── id (UUID, PK)
├── clinic_id (UUID, FK -> clinics)
├── location_id (UUID, FK -> locations)
├── client_id (UUID, FK -> clients)
├── pet_id (UUID, FK -> pets)
├── service_type_id (UUID, FK -> service_types)
├── profissional_id (UUID, FK -> profiles)
├── inicio (TIMESTAMP)
├── fim (TIMESTAMP)
├── status (appointment_status ENUM)
├── notas (TEXT)
├── confirmado (BOOLEAN)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

ENUM appointment_status: 'agendado', 'em_andamento', 'concluido', 'cancelado', 'faltou'
```

**Descrição**: Agendamentos de consultas e procedimentos.

**Índices**:
- `idx_appointments_clinic` em `clinic_id`
- `idx_appointments_date` em `inicio`
- `idx_appointments_client` em `client_id`
- `idx_appointments_pet` em `pet_id`

---

#### 2.2.9 Vaccines (Vacinas)
```sql
vaccines
├── id (UUID, PK)
├── clinic_id (UUID, FK -> clinics)
├── nome (TEXT)
├── fabricante (TEXT)
├── doses (INTEGER)
├── intervalo_dias (INTEGER)
├── validade_meses (INTEGER)
├── observacoes (TEXT)
├── ativo (BOOLEAN)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

**Descrição**: Catálogo de vacinas disponíveis.

---

#### 2.2.10 Vaccination Records (Registros de Vacinação)
```sql
vaccination_records
├── id (UUID, PK)
├── clinic_id (UUID, FK -> clinics)
├── pet_id (UUID, FK -> pets)
├── vaccine_id (UUID, FK -> vaccines)
├── aplicador_id (UUID, FK -> profiles)
├── data_aplicacao (DATE)
├── dose (INTEGER)
├── proxima_data (DATE)
├── lote (TEXT)
├── observacoes (TEXT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

**Descrição**: Histórico de vacinações aplicadas.

**Índices**:
- `idx_vacc_records_pet` em `pet_id`
- `idx_vacc_records_vaccine` em `vaccine_id`
- `idx_vacc_records_proxima` em `proxima_data`

---

#### 2.2.11 Products (Produtos)
```sql
products
├── id (UUID, PK)
├── clinic_id (UUID, FK -> clinics)
├── sku (TEXT, UNIQUE)
├── nome (TEXT)
├── categoria (TEXT)
├── descricao (TEXT)
├── preco_venda (NUMERIC)
├── custo (NUMERIC)
├── estoque_atual (INTEGER)
├── estoque_minimo (INTEGER)
├── unidade_medida (TEXT)
├── fabricante (TEXT)
├── ativo (BOOLEAN)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

**Descrição**: Catálogo de produtos.

**Índices**:
- `idx_products_clinic` em `clinic_id`
- `idx_products_sku` em `sku`

---

#### 2.2.12 Sales (Vendas)
```sql
sales
├── id (UUID, PK)
├── clinic_id (UUID, FK -> clinics)
├── location_id (UUID, FK -> locations)
├── client_id (UUID, FK -> clients)
├── created_by (UUID, FK -> profiles)
├── total_bruto (NUMERIC)
├── desconto (NUMERIC)
├── total_liquido (NUMERIC)
├── status (sale_status ENUM)
├── observacoes (TEXT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

ENUM sale_status: 'aberta', 'fechada', 'cancelada'
```

**Descrição**: Vendas realizadas.

---

#### 2.2.13 Sale Items (Itens de Venda)
```sql
sale_items
├── id (UUID, PK)
├── clinic_id (UUID, FK -> clinics)
├── sale_id (UUID, FK -> sales)
├── tipo (sale_item_type ENUM)
├── product_id (UUID, FK -> products, NULL)
├── service_type_id (UUID, FK -> service_types, NULL)
├── descricao (TEXT)
├── quantidade (NUMERIC)
├── preco_unitario (NUMERIC)
├── total (NUMERIC)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

ENUM sale_item_type: 'produto', 'servico'
```

**Descrição**: Itens individuais de uma venda.

---

#### 2.2.14 Payments (Pagamentos)
```sql
payments
├── id (UUID, PK)
├── clinic_id (UUID, FK -> clinics)
├── sale_id (UUID, FK -> sales)
├── valor (NUMERIC)
├── metodo (payment_method ENUM)
├── status (payment_status ENUM)
├── observacoes (TEXT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

ENUM payment_method: 'dinheiro', 'pix', 'credito', 'debito'
ENUM payment_status: 'pendente', 'aprovado', 'rejeitado', 'estornado'
```

**Descrição**: Pagamentos de vendas.

---

### 2.3 Funções do Banco

#### 2.3.1 has_role()
```sql
CREATE FUNCTION has_role(_user_id uuid, _clinic_id uuid, _role app_role)
RETURNS boolean
```

**Descrição**: Verifica se um usuário tem um papel específico em uma clínica.

**Uso**: Validação de permissões em políticas RLS.

---

#### 2.3.2 get_user_clinic_id()
```sql
CREATE FUNCTION get_user_clinic_id(_user_id uuid)
RETURNS uuid
```

**Descrição**: Retorna o ID da clínica do usuário.

**Uso**: Filtragem de dados por clínica em políticas RLS.

---

#### 2.3.3 update_updated_at_column()
```sql
CREATE FUNCTION update_updated_at_column()
RETURNS trigger
```

**Descrição**: Atualiza automaticamente o campo `updated_at` ao modificar um registro.

**Uso**: Trigger em todas as tabelas com `updated_at`.

---

#### 2.3.4 handle_new_user()
```sql
CREATE FUNCTION handle_new_user()
RETURNS trigger
```

**Descrição**: Cria automaticamente um perfil quando um novo usuário se registra.

**Uso**: Trigger em `auth.users` (INSERT).

---

#### 2.3.5 seed_mock_data()
```sql
CREATE FUNCTION seed_mock_data()
RETURNS json
```

**Descrição**: Popula o banco com dados de demonstração.

**Retorna**:
```json
{
  "clinic_id": "uuid",
  "created_clients": 100,
  "created_pets": 150,
  "created_products": 50,
  "created_vaccines": 10,
  "created_services": 15,
  "created_appts": 200,
  "created_sales": 150,
  "created_vacc_records": 100
}
```

**Uso**: Chamada no primeiro acesso do usuário ao Dashboard.

---

### 2.4 Row Level Security (RLS)

Todas as tabelas implementam **RLS** para garantir isolamento de dados entre clínicas.

#### Padrão de Políticas

**SELECT:**
```sql
CREATE POLICY "Users can view their clinic data"
ON table_name FOR SELECT
USING (clinic_id = get_user_clinic_id(auth.uid()));
```

**INSERT:**
```sql
CREATE POLICY "Users can insert data"
ON table_name FOR INSERT
WITH CHECK (clinic_id = get_user_clinic_id(auth.uid()));
```

**UPDATE:**
```sql
CREATE POLICY "Users can update their clinic data"
ON table_name FOR UPDATE
USING (clinic_id = get_user_clinic_id(auth.uid()));
```

**DELETE:**
```sql
CREATE POLICY "Admins can delete data"
ON table_name FOR DELETE
USING (
  clinic_id = get_user_clinic_id(auth.uid()) 
  AND has_role(auth.uid(), clinic_id, 'admin')
);
```

---

## 3. Autenticação e Segurança

### 3.1 Sistema de Autenticação

O TOGO utiliza **Supabase Auth** com as seguintes características:

- Email + Senha
- Auto-confirmação de email (habilitada)
- Sessões JWT
- Refresh tokens automáticos
- Cookies HTTP-only

### 3.2 Fluxo de Autenticação

```
┌─────────┐      ┌─────────┐      ┌──────────┐
│ Usuario │─────>│  Auth   │─────>│ Supabase │
│         │ Login│ Context │ JWT  │   Auth   │
└─────────┘      └─────────┘      └──────────┘
                      │
                      ▼
               ┌─────────────┐
               │  Protected  │
               │   Routes    │
               └─────────────┘
```

### 3.3 Context de Autenticação

**Localização**: `src/contexts/AuthContext.tsx`

**Funcionalidades**:
- `user`: Objeto do usuário autenticado
- `session`: Sessão ativa
- `loading`: Estado de carregamento
- `signIn(email, password)`: Login
- `signUp(email, password, nome)`: Cadastro
- `signOut()`: Logout

**Uso**:
```typescript
const { user, signIn, signOut } = useAuth();
```

### 3.4 Rotas Protegidas

**Componente**: `src/components/ProtectedRoute.tsx`

Redireciona para `/auth` se não autenticado.

**Uso**:
```tsx
<Route path="/" element={
  <ProtectedRoute>
    <Layout><Dashboard /></Layout>
  </ProtectedRoute>
} />
```

### 3.5 Segurança de Dados

1. **RLS**: Todas as queries respeitam políticas de segurança
2. **JWT**: Tokens seguros com expiração
3. **HTTPS**: Todas as comunicações criptografadas
4. **Validação**: Zod valida inputs no cliente
5. **Sanitização**: Proteção contra SQL injection

---

## 4. Frontend

### 4.1 Estrutura de Componentes

#### Hierarquia
```
App
├── BrowserRouter
│   └── AuthProvider
│       └── Routes
│           ├── /auth → Auth Page
│           └── /* → Protected Route
│               └── Layout
│                   ├── Sidebar
│                   ├── Header
│                   └── Main Content
│                       └── Page Component
```

### 4.2 Design System

**Arquivo**: `src/index.css`

#### Tokens de Cor (HSL)

**Modo Claro:**
```css
--background: 140 35% 92%
--foreground: 150 40% 20%
--primary: 155 45% 45%
--secondary: 145 30% 85%
--accent: 160 50% 55%
--success: 142 71% 45%
--warning: 38 92% 50%
--destructive: 0 84% 60%
```

**Modo Escuro:**
```css
--background: 145 28% 12%
--foreground: 140 20% 88%
--primary: 155 40% 48%
--secondary: 150 20% 22%
--accent: 160 38% 45%
```

#### Componentes shadcn/ui

Todos os componentes seguem o padrão shadcn/ui:
- Acessíveis (ARIA)
- Customizáveis
- Compostos (Radix UI)
- Estilizados com Tailwind

**Exemplo de uso**:
```tsx
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
  </CardHeader>
  <CardContent>
    <Button variant="primary">Clique</Button>
  </CardContent>
</Card>
```

### 4.3 Roteamento

**Arquivo**: `src/App.tsx`

**Rotas**:
- `/auth` - Autenticação (público)
- `/` - Dashboard (protegido)
- `/clientes` - Clientes (protegido)
- `/pets` - Pets (protegido)
- `/agenda` - Agenda (protegido)
- `/atendimentos` - Atendimentos (protegido)
- `/vacinas` - Vacinas (protegido)
- `/produtos` - Produtos (protegido)
- `/pdv` - PDV (protegido)
- `/financeiro` - Financeiro (protegido)
- `/relatorios` - Relatórios (protegido)
- `/config` - Configurações (protegido)
- `/*` - 404 NotFound

### 4.4 State Management

#### React Query

**Configuração**: `src/App.tsx`

```typescript
const queryClient = new QueryClient();
```

**Uso**:
```typescript
import { useQuery, useMutation } from '@tanstack/react-query'

// Query
const { data, isLoading } = useQuery({
  queryKey: ['clients'],
  queryFn: async () => {
    const { data } = await supabase.from('clients').select('*')
    return data
  }
})

// Mutation
const mutation = useMutation({
  mutationFn: async (newClient) => {
    const { data } = await supabase.from('clients').insert([newClient])
    return data
  },
  onSuccess: () => {
    queryClient.invalidateQueries(['clients'])
  }
})
```

#### Context API

**AuthContext**: Gerencia estado de autenticação globalmente.

### 4.5 Formulários

Padrão: **React Hook Form + Zod**

**Exemplo**:
```typescript
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const schema = z.object({
  nome: z.string().min(3, "Mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
})

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: {
    nome: "",
    email: "",
  }
})

const onSubmit = (data) => {
  // Dados validados
  console.log(data)
}
```

### 4.6 Notificações

Sistema de toasts com **Sonner**:

```typescript
import { toast } from "sonner"

toast.success("Operação realizada com sucesso!")
toast.error("Ocorreu um erro")
toast.info("Informação importante")
toast.warning("Atenção!")
```

---

## 5. Backend

### 5.1 Supabase Client

**Arquivo**: `src/integrations/supabase/client.ts` (auto-gerado)

```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
)
```

### 5.2 Operações CRUD

#### SELECT
```typescript
// Todos os clientes
const { data, error } = await supabase
  .from('clients')
  .select('*')

// Com filtro
const { data } = await supabase
  .from('clients')
  .select('*')
  .eq('clinic_id', clinicId)

// Com join
const { data } = await supabase
  .from('pets')
  .select('*, clients(*)')
  .eq('id', petId)
  .single()
```

#### INSERT
```typescript
const { data, error } = await supabase
  .from('clients')
  .insert([
    { nome: 'João Silva', email: 'joao@email.com' }
  ])
  .select()
```

#### UPDATE
```typescript
const { data, error } = await supabase
  .from('clients')
  .update({ telefone: '11999999999' })
  .eq('id', clientId)
```

#### DELETE
```typescript
const { error } = await supabase
  .from('clients')
  .delete()
  .eq('id', clientId)
```

### 5.3 Chamadas RPC

```typescript
// Seed de dados
const { data, error } = await supabase.rpc('seed_mock_data')

// Verificar role
const { data } = await supabase.rpc('has_role', {
  _user_id: userId,
  _clinic_id: clinicId,
  _role: 'admin'
})
```

### 5.4 Realtime (Futuro)

```typescript
const channel = supabase
  .channel('appointments')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'appointments' },
    (payload) => console.log('Mudança:', payload)
  )
  .subscribe()
```

---

## 6. Fluxos de Dados

### 6.1 Fluxo de Cadastro de Cliente

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Usuario  │───>│Formulário│───>│Validação │───>│ Supabase │
│          │    │  (UI)    │    │  (Zod)   │    │   RLS    │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                       │
                                                       ▼
                                                 ┌──────────┐
                                                 │ Database │
                                                 │  INSERT  │
                                                 └──────────┘
                                                       │
                                                       ▼
                                                 ┌──────────┐
                                                 │  Toast   │
                                                 │ Sucesso  │
                                                 └──────────┘
```

### 6.2 Fluxo de Agendamento

```
1. Usuário acessa /agenda
2. Seleciona data e horário
3. Escolhe cliente (busca em clients)
4. Escolhe pet do cliente (filtrado por client_id)
5. Escolhe tipo de serviço
6. Define profissional
7. Adiciona observações
8. Submete formulário
9. Validação Zod
10. INSERT em appointments
11. RLS valida clinic_id
12. Registro criado
13. Query invalidada (React Query)
14. Lista atualizada
15. Toast de sucesso
```

### 6.3 Fluxo de Venda (PDV)

```
1. Abrir nova venda (INSERT em sales, status='aberta')
2. Adicionar itens:
   a. Produto → INSERT em sale_items (tipo='produto')
   b. Serviço → INSERT em sale_items (tipo='servico')
3. Calcular totais:
   - total_bruto = SUM(sale_items.total)
   - total_liquido = total_bruto - desconto
4. Fechar venda (UPDATE sales, status='fechada')
5. Registrar pagamento (INSERT em payments)
6. Atualizar estoque (se produto):
   - UPDATE products SET estoque_atual = estoque_atual - quantidade
7. Toast de sucesso
```

### 6.4 Fluxo de Autenticação

```
SIGNUP:
1. Usuário preenche nome, email, senha
2. supabase.auth.signUp()
3. Trigger handle_new_user() cria profile
4. Email de confirmação (auto-confirm habilitado)
5. Redirect para /

LOGIN:
1. Usuário preenche email, senha
2. supabase.auth.signInWithPassword()
3. JWT armazenado
4. AuthContext atualizado
5. Redirect para /

LOGOUT:
1. Usuário clica em "Sair"
2. supabase.auth.signOut()
3. JWT removido
4. AuthContext limpo
5. Redirect para /auth
```

---

## 7. APIs e Integrações

### 7.1 Supabase API

**Base URL**: `https://lsdazqsdhtkojpysgmxw.supabase.co`

**Headers**:
```
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Authorization: Bearer <JWT_TOKEN>
```

### 7.2 Endpoints Principais

**Auth**:
- POST `/auth/v1/signup`
- POST `/auth/v1/token?grant_type=password`
- POST `/auth/v1/logout`
- GET `/auth/v1/user`

**Database REST**:
- GET `/rest/v1/{table}?select=*`
- POST `/rest/v1/{table}`
- PATCH `/rest/v1/{table}?id=eq.{id}`
- DELETE `/rest/v1/{table}?id=eq.{id}`

**RPC**:
- POST `/rest/v1/rpc/{function_name}`

### 7.3 Variáveis de Ambiente

**Arquivo**: `.env` (auto-gerado)

```env
VITE_SUPABASE_URL=https://lsdazqsdhtkojpysgmxw.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=lsdazqsdhtkojpysgmxw
```

---

## 8. Guia de Desenvolvimento

### 8.1 Setup Local

```bash
# Clone
git clone <repo>
cd togo

# Instalar
npm install

# Dev server
npm run dev
```

### 8.2 Convenções de Código

#### Nomenclatura

**Componentes**: PascalCase
```typescript
// ✅ Correto
export function ClientCard() {}

// ❌ Errado
export function clientCard() {}
```

**Funções/Variáveis**: camelCase
```typescript
// ✅ Correto
const handleSubmit = () => {}
const isLoading = true

// ❌ Errado
const HandleSubmit = () => {}
const IsLoading = true
```

**Constantes**: UPPER_SNAKE_CASE
```typescript
// ✅ Correto
const MAX_ITEMS = 100

// ❌ Errado
const maxItems = 100
```

**Arquivos**:
- Componentes: `PascalCase.tsx`
- Utilitários: `camelCase.ts`
- Tipos: `types.ts`

#### Estrutura de Componente

```tsx
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface Props {
  title: string
  onSubmit: () => void
}

export function MyComponent({ title, onSubmit }: Props) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    await onSubmit()
    setLoading(false)
  }

  return (
    <div>
      <h1>{title}</h1>
      <Button onClick={handleClick} disabled={loading}>
        Enviar
      </Button>
    </div>
  )
}
```

### 8.3 Criando Nova Página

1. **Criar arquivo** em `src/pages/MinhaPage.tsx`:
```tsx
import { Card, CardHeader, CardTitle } from "@/components/ui/card"

export default function MinhaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Minha Página</h1>
        <p className="text-muted-foreground">Descrição</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conteúdo</CardTitle>
        </CardHeader>
      </Card>
    </div>
  )
}
```

2. **Adicionar rota** em `src/App.tsx`:
```tsx
import MinhaPage from "./pages/MinhaPage"

// ...
<Route path="/minha-page" element={
  <ProtectedRoute>
    <Layout><MinhaPage /></Layout>
  </ProtectedRoute>
} />
```

3. **Adicionar ao menu** em `src/components/AppSidebar.tsx`:
```tsx
import { Icon } from "lucide-react"

const menuItems = [
  // ...
  { title: "Minha Página", url: "/minha-page", icon: Icon },
]
```

### 8.4 Adicionando Nova Tabela

1. **Criar migration SQL**:
```sql
CREATE TABLE minha_tabela (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS
ALTER TABLE minha_tabela ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their clinic data"
ON minha_tabela FOR SELECT
USING (clinic_id = get_user_clinic_id(auth.uid()));

-- Trigger
CREATE TRIGGER update_minha_tabela_updated_at
BEFORE UPDATE ON minha_tabela
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

2. **Tipos serão auto-gerados** em `src/integrations/supabase/types.ts`

3. **Usar no código**:
```tsx
const { data } = await supabase
  .from('minha_tabela')
  .select('*')
```

### 8.5 Debugging

**Console Logs**:
```typescript
console.log('Debug:', data)
console.error('Erro:', error)
```

**React Query Devtools** (adicionar):
```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

**Supabase Logs**: Acessar via Lovable Cloud

---

## 9. Deploy

### 9.1 Deploy Frontend

**Automático via Lovable**:
1. Código commitado no Git
2. Build automático
3. Deploy em `*.lovable.app`

**Manual**:
```bash
npm run build
# Arquivos em /dist
```

### 9.2 Variáveis de Ambiente

Configuradas automaticamente pelo Lovable Cloud.

Para ambientes externos:
```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

### 9.3 Domínio Customizado

1. Acessar Lovable → Project Settings → Domains
2. Adicionar domínio
3. Configurar DNS (CNAME ou A record)
4. Aguardar propagação

---

## 10. Manutenção

### 10.1 Backup de Dados

**Via Lovable Cloud**:
- Backups automáticos diários
- Retenção de 7 dias

**Manual (SQL)**:
```sql
-- Export para CSV
COPY (SELECT * FROM clients) TO '/tmp/clients.csv' CSV HEADER;
```

### 10.2 Monitoramento

**Métricas a observar**:
- Taxa de erro de autenticação
- Tempo de resposta de queries
- Uso de armazenamento
- Número de usuários ativos

**Logs**:
- Browser console (frontend)
- Lovable Cloud logs (backend)
- Supabase dashboard (database)

### 10.3 Atualizações

**Dependências**:
```bash
# Verificar atualizações
npm outdated

# Atualizar
npm update

# Atualizar major versions
npm install <package>@latest
```

**Migrations**:
- Sempre testar em desenvolvimento
- Fazer backup antes de aplicar
- Aplicar em horários de baixo tráfego

### 10.4 Performance

**Otimizações implementadas**:
- Lazy loading de rotas (futuro)
- Code splitting
- Image optimization
- Índices no banco
- React Query caching

**Monitorar**:
- Lighthouse score
- Bundle size
- Query performance

---

## 11. Troubleshooting

### 11.1 Problemas Comuns

**Erro: "User not authenticated"**
- Verificar se token JWT está válido
- Checar se usuário está logado
- Validar políticas RLS

**Erro: "Row level security policy violation"**
- Verificar se `clinic_id` está correto
- Checar permissões do usuário
- Validar função `get_user_clinic_id()`

**Formulário não valida**
- Verificar schema Zod
- Checar defaultValues
- Validar resolver

**Query não retorna dados**
- Verificar filtros
- Checar RLS policies
- Validar relações (JOINs)

### 11.2 Logs Úteis

```typescript
// Log de autenticação
const { data: { user } } = await supabase.auth.getUser()
console.log('Usuário autenticado:', user)

// Log de query
const { data, error } = await supabase.from('clients').select('*')
console.log('Dados:', data)
console.log('Erro:', error)

// Log de clinic_id
const { data: roles } = await supabase
  .from('user_roles')
  .select('clinic_id')
  .eq('user_id', user.id)
console.log('Clinic ID:', roles)
```

---

## 12. Roadmap Futuro

### 12.1 Funcionalidades Planejadas

- [ ] Sistema de notificações push
- [ ] Chat integrado com clientes
- [ ] Assinatura de documentos eletrônicos
- [ ] Integração com WhatsApp
- [ ] App mobile (React Native)
- [ ] Relatórios avançados com BI
- [ ] API pública para integrações
- [ ] Telemedicina veterinária
- [ ] Sistema de fidelidade

### 12.2 Melhorias Técnicas

- [ ] Implementar Realtime
- [ ] Adicionar testes (Jest + Testing Library)
- [ ] Implementar E2E tests (Playwright)
- [ ] CI/CD pipelines
- [ ] Monitoring (Sentry)
- [ ] Analytics (Google Analytics)
- [ ] SEO optimization
- [ ] PWA capabilities
- [ ] Offline support

---

## 13. Referências

- [React Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Docs](https://ui.shadcn.com/)
- [React Query Docs](https://tanstack.com/query/latest)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)

---

**Última atualização**: 2025-11-12

**Versão**: 1.0.0

**Mantido por**: Equipe TOGO
