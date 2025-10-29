-- Create function to generate mock data
CREATE OR REPLACE FUNCTION generate_mock_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_clinic_id uuid;
  v_location_id uuid;
  v_user_id uuid;
  v_client_id uuid;
  v_pet_id uuid;
  v_product_id uuid;
  v_vaccine_id uuid;
  v_service_type_id uuid;
  v_sale_id uuid;
  v_sale_total numeric;
  v_item_price numeric;
  i integer;
  j integer;
BEGIN
  -- Get clinic, location and user
  SELECT ur.clinic_id, ur.user_id INTO v_clinic_id, v_user_id
  FROM user_roles ur LIMIT 1;
  
  SELECT id INTO v_location_id FROM locations WHERE clinic_id = v_clinic_id LIMIT 1;
  
  IF v_clinic_id IS NULL OR v_location_id IS NULL THEN
    RAISE NOTICE 'No clinic/location found';
    RETURN;
  END IF;

  -- Generate 100 clients
  FOR i IN 1..100 LOOP
    INSERT INTO clients (clinic_id, nome, email, telefone, cpf_cnpj) 
    VALUES (
      v_clinic_id,
      (ARRAY['Ana', 'Carlos', 'Maria', 'João', 'Juliana', 'Pedro', 'Fernanda', 'Ricardo', 'Patricia', 'Roberto'])[1 + (i % 10)] || ' ' || 
      (ARRAY['Silva', 'Santos', 'Oliveira', 'Costa', 'Ferreira'])[1 + floor(random() * 5)::int],
      'cliente' || i || '@email.com',
      '(11) 9' || lpad((90000000 + i)::text, 8, '0'),
      lpad((10000000000 + i * 111)::text, 11, '0')
    );
  END LOOP;

  -- Generate 150+ pets
  FOR i IN 1..150 LOOP
    SELECT id INTO v_client_id FROM clients WHERE clinic_id = v_clinic_id ORDER BY random() LIMIT 1;
    INSERT INTO pets (clinic_id, client_id, nome, especie, raca, sexo, nascimento, castrado)
    VALUES (
      v_clinic_id, v_client_id,
      (ARRAY['Max', 'Bella', 'Luna', 'Thor', 'Mel', 'Bob', 'Nina', 'Rex'])[1 + floor(random() * 8)::int],
      (ARRAY['Cão', 'Gato'])[1 + floor(random() * 2)::int],
      'SRD',
      (ARRAY['Macho', 'Fêmea'])[1 + floor(random() * 2)::int],
      CURRENT_DATE - (30 + floor(random() * 3650))::int,
      random() > 0.5
    );
  END LOOP;

  -- Generate 50 products
  FOR i IN 1..50 LOOP
    INSERT INTO products (clinic_id, sku, nome, categoria, preco_venda, custo, estoque_atual, estoque_minimo)
    VALUES (
      v_clinic_id,
      'PROD-' || lpad(i::text, 4, '0'),
      CASE (i % 5)
        WHEN 0 THEN 'Ração Premium ' || i || 'kg'
        WHEN 1 THEN 'Antipulgas ' || i
        WHEN 2 THEN 'Vermífugo ' || i
        WHEN 3 THEN 'Shampoo ' || i
        ELSE 'Medicamento ' || i
      END,
      (ARRAY['Medicamentos', 'Rações', 'Acessórios', 'Higiene'])[1 + (i % 4)],
      15.00 + (random() * 485)::numeric(10,2),
      8.00 + (random() * 250)::numeric(10,2),
      5 + floor(random() * 200)::int,
      10 + floor(random() * 20)::int
    );
  END LOOP;

  -- Generate 10 vaccines
  INSERT INTO vaccines (clinic_id, nome, fabricante, doses, intervalo_dias)
  SELECT v_clinic_id, v.nome, v.fab, v.doses, v.dias
  FROM (VALUES
    ('V10', 'Zoetis', 3, 21),
    ('V8', 'MSD', 3, 21),
    ('Antirrábica', 'Boehringer', 1, NULL),
    ('Gripe Canina', 'Virbac', 2, 21),
    ('V4 Felina', 'Ceva', 2, 21),
    ('V5 Felina', 'Zoetis', 2, 21),
    ('Antirrábica Felina', 'MSD', 1, NULL),
    ('Giardia', 'Virbac', 2, 21),
    ('Tosse dos Canis', 'Ceva', 1, NULL),
    ('Leishmaniose', 'Zoetis', 3, 21)
  ) AS v(nome, fab, doses, dias);

  -- Generate 15 service types
  INSERT INTO service_types (clinic_id, nome, categoria, preco_base, duracao_minutos)
  SELECT v_clinic_id, v.nome, v.cat, v.preco, v.dur
  FROM (VALUES
    ('Consulta Geral', 'consulta', 150.00, 30),
    ('Consulta Retorno', 'consulta', 80.00, 30),
    ('Vacinação', 'consulta', 60.00, 30),
    ('Banho Simples', 'estetica', 45.00, 60),
    ('Banho e Tosa', 'estetica', 85.00, 60),
    ('Tosa Higiênica', 'estetica', 35.00, 60),
    ('Cirurgia Castração', 'cirurgia', 350.00, 120),
    ('Cirurgia Geral', 'cirurgia', 500.00, 120),
    ('Internação Diária', 'internacao', 120.00, 30),
    ('Raio-X', 'exame', 180.00, 45),
    ('Ultrassom', 'exame', 200.00, 45),
    ('Exames Laboratoriais', 'exame', 90.00, 45),
    ('Aplicação Medicamento', 'consulta', 25.00, 30),
    ('Limpeza Dentária', 'consulta', 280.00, 30),
    ('Emergência', 'consulta', 200.00, 30)
  ) AS v(nome, cat, preco, dur);

  -- Generate 200 appointments
  FOR i IN 1..200 LOOP
    SELECT id INTO v_client_id FROM clients WHERE clinic_id = v_clinic_id ORDER BY random() LIMIT 1;
    SELECT id INTO v_pet_id FROM pets WHERE clinic_id = v_clinic_id AND client_id = v_client_id ORDER BY random() LIMIT 1;
    SELECT id INTO v_service_type_id FROM service_types WHERE clinic_id = v_clinic_id ORDER BY random() LIMIT 1;
    
    INSERT INTO appointments (clinic_id, location_id, client_id, pet_id, service_type_id, profissional_id, inicio, fim, status)
    VALUES (
      v_clinic_id, v_location_id, v_client_id, v_pet_id, v_service_type_id, v_user_id,
      (CURRENT_DATE - 60) + (floor(random() * 90)::int) + (8 + floor(random() * 10)::int) * interval '1 hour',
      (CURRENT_DATE - 60) + (floor(random() * 90)::int) + (8 + floor(random() * 10)::int) * interval '1 hour' + interval '30 minutes',
      (ARRAY['agendado', 'confirmado', 'concluido', 'cancelado']::appointment_status[])[CASE WHEN random() < 0.7 THEN 3 ELSE 1 END]
    );
  END LOOP;

  -- Generate 150 sales with items
  FOR i IN 1..150 LOOP
    v_sale_total := 0;
    SELECT id INTO v_client_id FROM clients WHERE clinic_id = v_clinic_id ORDER BY random() LIMIT 1;
    
    INSERT INTO sales (clinic_id, location_id, client_id, created_by, total_bruto, desconto, total_liquido, status, created_at)
    VALUES (
      v_clinic_id, v_location_id, 
      CASE WHEN random() > 0.2 THEN v_client_id ELSE NULL END,
      v_user_id, 0, 0, 0, 'fechada',
      (CURRENT_DATE - 90) + (floor(random() * 90)::int) + (8 + floor(random() * 12)::int) * interval '1 hour'
    ) RETURNING id INTO v_sale_id;
    
    -- Add 1-5 items
    FOR j IN 1..(1 + floor(random() * 5)::int) LOOP
      IF random() > 0.4 THEN
        -- Product
        SELECT id, preco_venda INTO v_product_id, v_item_price 
        FROM products WHERE clinic_id = v_clinic_id ORDER BY random() LIMIT 1;
        
        INSERT INTO sale_items (clinic_id, sale_id, tipo, product_id, descricao, quantidade, preco_unitario, total)
        VALUES (v_clinic_id, v_sale_id, 'produto', v_product_id, 'Produto', 1, v_item_price, v_item_price);
        v_sale_total := v_sale_total + v_item_price;
      ELSE
        -- Service
        SELECT id, preco_base INTO v_service_type_id, v_item_price
        FROM service_types WHERE clinic_id = v_clinic_id ORDER BY random() LIMIT 1;
        
        INSERT INTO sale_items (clinic_id, sale_id, tipo, service_type_id, descricao, quantidade, preco_unitario, total)
        VALUES (v_clinic_id, v_sale_id, 'servico', v_service_type_id, 'Serviço', 1, v_item_price, v_item_price);
        v_sale_total := v_sale_total + v_item_price;
      END IF;
    END LOOP;
    
    -- Update sale totals
    UPDATE sales SET total_bruto = v_sale_total, total_liquido = v_sale_total WHERE id = v_sale_id;
    
    -- Add payment
    INSERT INTO payments (clinic_id, sale_id, valor, metodo, status)
    VALUES (v_clinic_id, v_sale_id, v_sale_total, 
      (ARRAY['dinheiro', 'credito', 'debito', 'pix']::payment_method[])[1 + floor(random() * 4)::int],
      'aprovado');
  END LOOP;

  -- Generate 100 vaccination records
  FOR i IN 1..100 LOOP
    SELECT id INTO v_pet_id FROM pets WHERE clinic_id = v_clinic_id ORDER BY random() LIMIT 1;
    SELECT id INTO v_vaccine_id FROM vaccines WHERE clinic_id = v_clinic_id ORDER BY random() LIMIT 1;
    
    INSERT INTO vaccination_records (clinic_id, pet_id, vaccine_id, aplicador_id, data_aplicacao, dose, proxima_data, lote)
    VALUES (
      v_clinic_id, v_pet_id, v_vaccine_id, v_user_id,
      CURRENT_DATE - floor(random() * 180)::int,
      1 + floor(random() * 3)::int,
      CASE WHEN random() > 0.5 THEN CURRENT_DATE + (1 + floor(random() * 60)::int) ELSE NULL END,
      'LOTE-' || lpad(floor(random() * 10000)::text, 6, '0')
    );
  END LOOP;

  RAISE NOTICE 'Mock data generated: 100 clients, 150 pets, 50 products, 10 vaccines, 15 services, 200 appointments, 150 sales, 100 vaccinations';
END;
$$;

-- Execute the function
SELECT generate_mock_data();

-- Drop the function after use
DROP FUNCTION generate_mock_data();