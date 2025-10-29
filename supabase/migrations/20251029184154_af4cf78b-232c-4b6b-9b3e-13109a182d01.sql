-- Script para popular dados de teste no sistema
-- Este script pode ser executado apenas uma vez para criar dados de demonstração

-- Inserir clientes mockados (se não existirem)
DO $$
DECLARE
  v_clinic_id uuid;
  v_location_id uuid;
  v_client1_id uuid;
  v_client2_id uuid;
  v_client3_id uuid;
  v_client4_id uuid;
  v_client5_id uuid;
  v_pet1_id uuid;
  v_pet2_id uuid;
  v_pet3_id uuid;
  v_pet4_id uuid;
  v_pet5_id uuid;
  v_pet6_id uuid;
BEGIN
  -- Buscar a primeira clinic_id disponível
  SELECT id INTO v_clinic_id FROM public.clinics LIMIT 1;
  
  -- Buscar a primeira location_id disponível
  SELECT id INTO v_location_id FROM public.locations WHERE clinic_id = v_clinic_id LIMIT 1;
  
  IF v_clinic_id IS NOT NULL AND v_location_id IS NOT NULL THEN
    -- Inserir clientes se não existirem
    IF NOT EXISTS (SELECT 1 FROM public.clients WHERE email = 'maria.silva@email.com') THEN
      INSERT INTO public.clients (clinic_id, nome, email, telefone, cpf_cnpj, observacoes)
      VALUES 
        (v_clinic_id, 'Maria Silva Santos', 'maria.silva@email.com', '(11) 98765-4321', '123.456.789-00', 'Cliente VIP, preferência por atendimento às terças')
      RETURNING id INTO v_client1_id;
      
      INSERT INTO public.clients (clinic_id, nome, email, telefone, cpf_cnpj, observacoes)
      VALUES 
        (v_clinic_id, 'João Pedro Oliveira', 'joao.pedro@email.com', '(11) 97654-3210', '987.654.321-00', 'Possui 2 cachorros')
      RETURNING id INTO v_client2_id;
      
      INSERT INTO public.clients (clinic_id, nome, email, telefone, cpf_cnpj)
      VALUES 
        (v_clinic_id, 'Ana Carolina Costa', 'ana.costa@email.com', '(11) 96543-2109', '456.789.123-00')
      RETURNING id INTO v_client3_id;
      
      INSERT INTO public.clients (clinic_id, nome, email, telefone, cpf_cnpj, observacoes)
      VALUES 
        (v_clinic_id, 'Carlos Eduardo Lima', 'carlos.lima@email.com', '(11) 95432-1098', '789.123.456-00', 'Paga sempre à vista')
      RETURNING id INTO v_client4_id;
      
      INSERT INTO public.clients (clinic_id, nome, email, telefone, cpf_cnpj, observacoes)
      VALUES 
        (v_clinic_id, 'Juliana Mendes', 'juliana.mendes@email.com', '(11) 94321-0987', '321.654.987-00', 'Tem receio de consultas, marcar com paciência')
      RETURNING id INTO v_client5_id;

      -- Inserir pets
      INSERT INTO public.pets (clinic_id, client_id, nome, especie, raca, sexo, nascimento, castrado, cor)
      VALUES 
        (v_clinic_id, v_client1_id, 'Rex', 'Canino', 'Labrador', 'Macho', '2020-03-15', true, 'Amarelo')
      RETURNING id INTO v_pet1_id;
      
      INSERT INTO public.pets (clinic_id, client_id, nome, especie, raca, sexo, nascimento, castrado, cor, alergias)
      VALUES 
        (v_clinic_id, v_client2_id, 'Luna', 'Felino', 'Siamês', 'Fêmea', '2021-07-20', true, 'Branco e Preto', 'Alergia a frango')
      RETURNING id INTO v_pet2_id;
      
      INSERT INTO public.pets (clinic_id, client_id, nome, especie, raca, sexo, nascimento, castrado, cor)
      VALUES 
        (v_clinic_id, v_client2_id, 'Thor', 'Canino', 'Pastor Alemão', 'Macho', '2019-11-10', false, 'Preto e Marrom')
      RETURNING id INTO v_pet3_id;
      
      INSERT INTO public.pets (clinic_id, client_id, nome, especie, raca, sexo, nascimento, castrado, cor)
      VALUES 
        (v_clinic_id, v_client3_id, 'Mia', 'Felino', 'Persa', 'Fêmea', '2022-01-05', true, 'Branco')
      RETURNING id INTO v_pet4_id;
      
      INSERT INTO public.pets (clinic_id, client_id, nome, especie, raca, sexo, nascimento, castrado, cor, alergias)
      VALUES 
        (v_clinic_id, v_client4_id, 'Bob', 'Canino', 'Poodle', 'Macho', '2021-04-25', true, 'Branco', 'Alergia a pulgas')
      RETURNING id INTO v_pet5_id;
      
      INSERT INTO public.pets (clinic_id, client_id, nome, especie, raca, sexo, nascimento, castrado, cor)
      VALUES 
        (v_clinic_id, v_client5_id, 'Nina', 'Felino', 'SRD', 'Fêmea', '2023-02-14', false, 'Tricolor')
      RETURNING id INTO v_pet6_id;

      -- Inserir alguns agendamentos de exemplo
      INSERT INTO public.appointments (clinic_id, location_id, client_id, pet_id, inicio, fim, status, notas)
      VALUES 
        (v_clinic_id, v_location_id, v_client1_id, v_pet1_id, 
         CURRENT_DATE + INTERVAL '1 day' + INTERVAL '9 hours', 
         CURRENT_DATE + INTERVAL '1 day' + INTERVAL '9 hours 30 minutes', 
         'agendado', 'Consulta de rotina'),
        (v_clinic_id, v_location_id, v_client2_id, v_pet2_id, 
         CURRENT_DATE + INTERVAL '1 day' + INTERVAL '10 hours', 
         CURRENT_DATE + INTERVAL '1 day' + INTERVAL '10 hours 30 minutes', 
         'agendado', 'Vacinação'),
        (v_clinic_id, v_location_id, v_client3_id, v_pet4_id, 
         CURRENT_DATE + INTERVAL '2 days' + INTERVAL '14 hours', 
         CURRENT_DATE + INTERVAL '2 days' + INTERVAL '14 hours 30 minutes', 
         'agendado', NULL),
        (v_clinic_id, v_location_id, v_client4_id, v_pet5_id, 
         CURRENT_DATE + INTERVAL '3 days' + INTERVAL '11 hours', 
         CURRENT_DATE + INTERVAL '3 days' + INTERVAL '11 hours 30 minutes', 
         'agendado', 'Banho e tosa');

      RAISE NOTICE 'Dados de teste inseridos com sucesso!';
    ELSE
      RAISE NOTICE 'Dados de teste já existem, pulando inserção.';
    END IF;
  ELSE
    RAISE NOTICE 'Nenhuma clínica ou localização encontrada. Execute primeiro o sistema para criar os dados básicos.';
  END IF;
END $$;