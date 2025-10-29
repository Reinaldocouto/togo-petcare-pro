-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE app_role AS ENUM ('admin', 'veterinario', 'recepcao', 'groomer', 'financeiro');
CREATE TYPE appointment_status AS ENUM ('agendado', 'em_andamento', 'concluido', 'faltou', 'cancelado');
CREATE TYPE location_type AS ENUM ('matriz', 'filial');
CREATE TYPE service_category AS ENUM ('consulta', 'cirurgia', 'exame', 'banho', 'tosa', 'hospedagem');
CREATE TYPE sale_status AS ENUM ('aberta', 'fechada', 'cancelada');
CREATE TYPE payment_method AS ENUM ('pix', 'credito', 'debito', 'dinheiro');

-- Clinics table (multi-tenant root)
CREATE TABLE public.clinics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  ie TEXT,
  im TEXT,
  endereco JSONB,
  municipio_ibge TEXT,
  fiscal_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

-- Locations table (multi-unit support)
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo location_type NOT NULL DEFAULT 'matriz',
  endereco JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- User roles table (RBAC)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, clinic_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cpf_cnpj TEXT,
  email TEXT,
  telefone TEXT,
  endereco JSONB,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_clients_clinic_id ON public.clients(clinic_id);
CREATE INDEX idx_clients_nome ON public.clients(nome);
CREATE INDEX idx_clients_telefone ON public.clients(telefone);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Pets table
CREATE TABLE public.pets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  especie TEXT NOT NULL,
  raca TEXT,
  sexo TEXT,
  nascimento DATE,
  castrado BOOLEAN DEFAULT false,
  cor TEXT,
  microchip TEXT,
  alergias TEXT,
  foto_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pets_clinic_id ON public.pets(clinic_id);
CREATE INDEX idx_pets_client_id ON public.pets(client_id);
CREATE INDEX idx_pets_nome ON public.pets(nome);

ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

-- Service types table
CREATE TABLE public.service_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  categoria service_category NOT NULL,
  duracao_minutos INTEGER NOT NULL DEFAULT 30,
  preco_base DECIMAL(10,2) NOT NULL DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_service_types_clinic_id ON public.service_types(clinic_id);

ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;

-- Appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  profissional_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  service_type_id UUID REFERENCES public.service_types(id) ON DELETE SET NULL,
  inicio TIMESTAMPTZ NOT NULL,
  fim TIMESTAMPTZ NOT NULL,
  status appointment_status NOT NULL DEFAULT 'agendado',
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointments_clinic_id ON public.appointments(clinic_id);
CREATE INDEX idx_appointments_inicio ON public.appointments(inicio);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_appointments_pet_id ON public.appointments(pet_id);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Medical records table (SOAP)
CREATE TABLE public.medical_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  veterinario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  tipo_atendimento TEXT NOT NULL,
  soap JSONB NOT NULL DEFAULT '{}'::jsonb,
  anexos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_medical_records_clinic_id ON public.medical_records(clinic_id);
CREATE INDEX idx_medical_records_pet_id ON public.medical_records(pet_id);

ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

-- Vaccines table
CREATE TABLE public.vaccines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  fabricante TEXT,
  doses INTEGER NOT NULL DEFAULT 1,
  intervalo_dias INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vaccines_clinic_id ON public.vaccines(clinic_id);

ALTER TABLE public.vaccines ENABLE ROW LEVEL SECURITY;

-- Vaccination records table
CREATE TABLE public.vaccination_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  vaccine_id UUID NOT NULL REFERENCES public.vaccines(id) ON DELETE CASCADE,
  dose INTEGER NOT NULL,
  data_aplicacao DATE NOT NULL,
  proxima_data DATE,
  lote TEXT,
  aplicador_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vaccination_records_clinic_id ON public.vaccination_records(clinic_id);
CREATE INDEX idx_vaccination_records_pet_id ON public.vaccination_records(pet_id);
CREATE INDEX idx_vaccination_records_proxima_data ON public.vaccination_records(proxima_data);

ALTER TABLE public.vaccination_records ENABLE ROW LEVEL SECURITY;

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  nome TEXT NOT NULL,
  categoria TEXT,
  preco_venda DECIMAL(10,2) NOT NULL DEFAULT 0,
  custo DECIMAL(10,2) DEFAULT 0,
  ncm TEXT,
  estoque_minimo INTEGER DEFAULT 0,
  estoque_atual INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(clinic_id, sku)
);

CREATE INDEX idx_products_clinic_id ON public.products(clinic_id);
CREATE INDEX idx_products_sku ON public.products(sku);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Sales table
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  status sale_status NOT NULL DEFAULT 'aberta',
  total_bruto DECIMAL(10,2) NOT NULL DEFAULT 0,
  desconto DECIMAL(10,2) DEFAULT 0,
  total_liquido DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sales_clinic_id ON public.sales(clinic_id);
CREATE INDEX idx_sales_created_at ON public.sales(created_at);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Sale items table
CREATE TABLE public.sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  service_type_id UUID REFERENCES public.service_types(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  quantidade DECIMAL(10,2) NOT NULL DEFAULT 1,
  preco_unitario DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sale_items_sale_id ON public.sale_items(sale_id);

ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- Payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
  metodo payment_method NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  nsu TEXT,
  status TEXT DEFAULT 'aprovado',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_clinic_id ON public.payments(clinic_id);
CREATE INDEX idx_payments_sale_id ON public.payments(sale_id);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Function to check if user has role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _clinic_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND clinic_id = _clinic_id
      AND role = _role
  )
$$;

-- Function to get user clinic_id
CREATE OR REPLACE FUNCTION public.get_user_clinic_id(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT clinic_id
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON public.clinics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON public.pets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- Clinics: users can only see their own clinic
CREATE POLICY "Users can view their own clinic"
  ON public.clinics FOR SELECT
  USING (id = public.get_user_clinic_id(auth.uid()));

-- Locations: scoped by clinic_id
CREATE POLICY "Users can view locations in their clinic"
  ON public.locations FOR SELECT
  USING (clinic_id = public.get_user_clinic_id(auth.uid()));

-- User roles: users can view their own roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

-- Profiles: users can view and update their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- Clients: scoped by clinic_id
CREATE POLICY "Users can view clients in their clinic"
  ON public.clients FOR SELECT
  USING (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert clients in their clinic"
  ON public.clients FOR INSERT
  WITH CHECK (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can update clients in their clinic"
  ON public.clients FOR UPDATE
  USING (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can delete clients in their clinic"
  ON public.clients FOR DELETE
  USING (clinic_id = public.get_user_clinic_id(auth.uid()));

-- Pets: scoped by clinic_id
CREATE POLICY "Users can view pets in their clinic"
  ON public.pets FOR SELECT
  USING (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert pets in their clinic"
  ON public.pets FOR INSERT
  WITH CHECK (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can update pets in their clinic"
  ON public.pets FOR UPDATE
  USING (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can delete pets in their clinic"
  ON public.pets FOR DELETE
  USING (clinic_id = public.get_user_clinic_id(auth.uid()));

-- Service types: scoped by clinic_id
CREATE POLICY "Users can view service types in their clinic"
  ON public.service_types FOR SELECT
  USING (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Admins can manage service types"
  ON public.service_types FOR ALL
  USING (public.has_role(auth.uid(), clinic_id, 'admin'));

-- Appointments: scoped by clinic_id
CREATE POLICY "Users can view appointments in their clinic"
  ON public.appointments FOR SELECT
  USING (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert appointments in their clinic"
  ON public.appointments FOR INSERT
  WITH CHECK (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can update appointments in their clinic"
  ON public.appointments FOR UPDATE
  USING (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can delete appointments in their clinic"
  ON public.appointments FOR DELETE
  USING (clinic_id = public.get_user_clinic_id(auth.uid()));

-- Medical records: scoped by clinic_id
CREATE POLICY "Users can view medical records in their clinic"
  ON public.medical_records FOR SELECT
  USING (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Veterinarians can insert medical records"
  ON public.medical_records FOR INSERT
  WITH CHECK (
    clinic_id = public.get_user_clinic_id(auth.uid()) AND
    public.has_role(auth.uid(), clinic_id, 'veterinario')
  );

-- Vaccines: scoped by clinic_id
CREATE POLICY "Users can view vaccines in their clinic"
  ON public.vaccines FOR SELECT
  USING (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Admins can manage vaccines"
  ON public.vaccines FOR ALL
  USING (public.has_role(auth.uid(), clinic_id, 'admin'));

-- Vaccination records: scoped by clinic_id
CREATE POLICY "Users can view vaccination records in their clinic"
  ON public.vaccination_records FOR SELECT
  USING (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert vaccination records in their clinic"
  ON public.vaccination_records FOR INSERT
  WITH CHECK (clinic_id = public.get_user_clinic_id(auth.uid()));

-- Products: scoped by clinic_id
CREATE POLICY "Users can view products in their clinic"
  ON public.products FOR SELECT
  USING (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  USING (public.has_role(auth.uid(), clinic_id, 'admin'));

-- Sales: scoped by clinic_id
CREATE POLICY "Users can view sales in their clinic"
  ON public.sales FOR SELECT
  USING (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert sales in their clinic"
  ON public.sales FOR INSERT
  WITH CHECK (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can update sales in their clinic"
  ON public.sales FOR UPDATE
  USING (clinic_id = public.get_user_clinic_id(auth.uid()));

-- Sale items: scoped by clinic_id
CREATE POLICY "Users can view sale items in their clinic"
  ON public.sale_items FOR SELECT
  USING (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert sale items in their clinic"
  ON public.sale_items FOR INSERT
  WITH CHECK (clinic_id = public.get_user_clinic_id(auth.uid()));

-- Payments: scoped by clinic_id
CREATE POLICY "Users can view payments in their clinic"
  ON public.payments FOR SELECT
  USING (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert payments in their clinic"
  ON public.payments FOR INSERT
  WITH CHECK (clinic_id = public.get_user_clinic_id(auth.uid()));