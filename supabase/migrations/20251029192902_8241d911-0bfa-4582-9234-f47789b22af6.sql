-- Fix seed function: cast enum values to correct types to avoid 42804 errors
CREATE OR REPLACE FUNCTION public.seed_mock_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  uid uuid := auth.uid();
  clinic uuid;
  loc uuid;
  v_sale_id uuid;
  v_prod uuid;
  v_service uuid;
  v_price numeric;
  i int;
  j int;
  created_clients int := 0;
  created_pets int := 0;
  created_products int := 0;
  created_vaccines int := 0;
  created_services int := 0;
  created_appts int := 0;
  created_sales int := 0;
  created_vacc_records int := 0;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT get_user_clinic_id(uid) INTO clinic;

  IF clinic IS NULL THEN
    INSERT INTO clinics (nome) VALUES ('Clínica Demo') RETURNING id INTO clinic;
    INSERT INTO user_roles (user_id, clinic_id, role) VALUES (uid, clinic, 'admin');
  END IF;

  SELECT id INTO loc FROM locations WHERE clinic_id = clinic LIMIT 1;
  IF loc IS NULL THEN
    INSERT INTO locations (clinic_id, nome, tipo) VALUES (clinic, 'Matriz', 'matriz'::location_type) RETURNING id INTO loc;
  END IF;

  -- Seed only if empty to avoid duplicates
  IF (SELECT count(*) FROM clients WHERE clinic_id = clinic) = 0 THEN
    -- 100 clients
    INSERT INTO clients (clinic_id, nome, email, telefone, cpf_cnpj)
    SELECT clinic,
           (ARRAY['Ana','Carlos','Maria','João','Juliana','Pedro','Fernanda','Ricardo','Patricia','Roberto'])[(g%10)+1] || ' ' ||
           (ARRAY['Silva','Santos','Oliveira','Costa','Ferreira'])[(g%5)+1],
           'cliente'||g||'@email.com',
           '(11) 9'|| lpad((90000000+g)::text,8,'0'),
           lpad((10000000000 + g*111)::text,11,'0')
    FROM generate_series(1,100) g;
    GET DIAGNOSTICS created_clients = ROW_COUNT;

    -- 150 pets
    FOR i IN 1..150 LOOP
      INSERT INTO pets (clinic_id, client_id, nome, especie, raca, sexo, nascimento, castrado, cor)
      VALUES (
        clinic,
        (SELECT id FROM clients WHERE clinic_id=clinic ORDER BY random() LIMIT 1),
        (ARRAY['Max','Bella','Luna','Thor','Mel','Bob','Nina','Rex','Mia','Fred'])[(1+floor(random()*10))::int],
        (ARRAY['Cão','Gato'])[(1+floor(random()*2))::int],
        'SRD',
        (ARRAY['Macho','Fêmea'])[(1+floor(random()*2))::int],
        CURRENT_DATE - (30 + floor(random()*3650))::int,
        random()>0.5,
        (ARRAY['Preto','Branco','Marrom','Caramelo','Cinza'])[(1+floor(random()*5))::int]
      );
      created_pets := created_pets + 1;
    END LOOP;

    -- 50 products
    IF (SELECT count(*) FROM products WHERE clinic_id=clinic) = 0 THEN
      FOR i IN 1..50 LOOP
        INSERT INTO products (clinic_id, sku, nome, categoria, preco_venda, custo, estoque_atual, estoque_minimo, ativo)
        VALUES (
          clinic,
          'PROD-'||lpad(i::text,4,'0'),
          CASE WHEN i%5=0 THEN 'Ração Premium '||i||'kg'
               WHEN i%5=1 THEN 'Antipulgas '||i
               WHEN i%5=2 THEN 'Vermífugo '||i
               WHEN i%5=3 THEN 'Shampoo '||i
               ELSE 'Medicamento '||i END,
          (ARRAY['Medicamentos','Rações','Acessórios','Higiene'])[(i%4)+1],
          15 + (random()*485),
          8 + (random()*250),
          5 + floor(random()*200)::int,
          10 + floor(random()*20)::int,
          true
        );
        created_products := created_products + 1;
      END LOOP;
    END IF;

    -- 10 vaccines
    IF (SELECT count(*) FROM vaccines WHERE clinic_id=clinic) = 0 THEN
      INSERT INTO vaccines (clinic_id, nome, fabricante, doses, intervalo_dias)
      SELECT clinic, v.* FROM (VALUES
        ('V10','Zoetis',3,21),
        ('V8','MSD',3,21),
        ('Antirrábica','Boehringer',1,NULL),
        ('Gripe Canina','Virbac',2,21),
        ('V4 Felina','Ceva',2,21),
        ('V5 Felina','Zoetis',2,21),
        ('Antirrábica Felina','MSD',1,NULL),
        ('Giardia','Virbac',2,21),
        ('Tosse dos Canis','Ceva',1,NULL),
        ('Leishmaniose','Zoetis',3,21)
      ) AS v(nome, fabricante, doses, intervalo_dias);
      GET DIAGNOSTICS created_vaccines = ROW_COUNT;
    END IF;

    -- 15 service types (categoria is enum service_category)
    IF (SELECT count(*) FROM service_types WHERE clinic_id=clinic) = 0 THEN
      INSERT INTO service_types (clinic_id, nome, categoria, preco_base, duracao_minutos)
      SELECT clinic, s.nome, s.categoria::service_category, s.preco_base, s.duracao_minutos
      FROM (VALUES
        ('Consulta Geral','consulta',150.00,30),
        ('Consulta Retorno','consulta',80.00,30),
        ('Vacinação','consulta',60.00,30),
        ('Banho Simples','estetica',45.00,60),
        ('Banho e Tosa','estetica',85.00,60),
        ('Tosa Higiênica','estetica',35.00,60),
        ('Cirurgia Castração','cirurgia',350.00,120),
        ('Cirurgia Geral','cirurgia',500.00,120),
        ('Internação Diária','internacao',120.00,30),
        ('Raio-X','exame',180.00,45),
        ('Ultrassom','exame',200.00,45),
        ('Exames Laboratoriais','exame',90.00,45),
        ('Aplicação Medicamento','consulta',25.00,30),
        ('Limpeza Dentária','consulta',280.00,30),
        ('Emergência','consulta',200.00,30)
      ) AS s(nome, categoria, preco_base, duracao_minutos);
      GET DIAGNOSTICS created_services = ROW_COUNT;
    END IF;

    -- 200 appointments
    FOR i IN 1..200 LOOP
      INSERT INTO appointments (clinic_id, location_id, client_id, pet_id, service_type_id, profissional_id, inicio, fim, status)
      VALUES (
        clinic,
        loc,
        (SELECT id FROM clients WHERE clinic_id=clinic ORDER BY random() LIMIT 1),
        (SELECT id FROM pets WHERE clinic_id=clinic ORDER BY random() LIMIT 1),
        (SELECT id FROM service_types WHERE clinic_id=clinic ORDER BY random() LIMIT 1),
        uid,
        (CURRENT_DATE - 60) + (floor(random()*90)::int) + (8 + floor(random()*10)::int) * interval '1 hour',
        (CURRENT_DATE - 60) + (floor(random()*90)::int) + (8 + floor(random()*10)::int) * interval '1 hour' + interval '30 minutes',
        CASE WHEN random() < 0.7 THEN 'concluido' ELSE 'agendado' END::appointment_status
      );
      created_appts := created_appts + 1;
    END LOOP;

    -- 150 sales with items
    FOR i IN 1..150 LOOP
      INSERT INTO sales (clinic_id, location_id, client_id, created_by, total_bruto, desconto, total_liquido, status, created_at)
      VALUES (
        clinic,
        loc,
        (SELECT id FROM clients WHERE clinic_id=clinic ORDER BY random() LIMIT 1),
        uid,
        0, 0, 0, 'fechada',
        (CURRENT_DATE - 90) + (floor(random()*90)::int) + (8 + floor(random()*12)::int) * interval '1 hour'
      ) RETURNING id INTO v_sale_id;

      FOR j IN 1..(1 + floor(random()*5)::int) LOOP
        IF random() > 0.4 THEN
          SELECT id, preco_venda INTO v_prod, v_price FROM products WHERE clinic_id=clinic ORDER BY random() LIMIT 1;
          INSERT INTO sale_items (clinic_id, sale_id, tipo, product_id, descricao, quantidade, preco_unitario, total)
          VALUES (clinic, v_sale_id, 'produto', v_prod, 'Produto', 1, v_price, v_price);
        ELSE
          SELECT id, preco_base INTO v_service, v_price FROM service_types WHERE clinic_id=clinic ORDER BY random() LIMIT 1;
          INSERT INTO sale_items (clinic_id, sale_id, tipo, service_type_id, descricao, quantidade, preco_unitario, total)
          VALUES (clinic, v_sale_id, 'servico', v_service, 'Serviço', 1, v_price, v_price);
        END IF;
      END LOOP;

      UPDATE sales s SET
        total_bruto = (SELECT coalesce(sum(total),0) FROM sale_items si WHERE si.sale_id = v_sale_id),
        total_liquido = (SELECT coalesce(sum(total),0) FROM sale_items si WHERE si.sale_id = v_sale_id)
      WHERE s.id = v_sale_id;

      INSERT INTO payments (clinic_id, sale_id, valor, metodo, status)
      VALUES (clinic, v_sale_id, (SELECT total_liquido FROM sales WHERE id = v_sale_id), 'pix'::payment_method, 'aprovado');
      created_sales := created_sales + 1;
    END LOOP;

    -- 100 vaccination records
    FOR i IN 1..100 LOOP
      INSERT INTO vaccination_records (clinic_id, pet_id, vaccine_id, aplicador_id, data_aplicacao, dose, proxima_data, lote)
      VALUES (
        clinic,
        (SELECT id FROM pets WHERE clinic_id=clinic ORDER BY random() LIMIT 1),
        (SELECT id FROM vaccines WHERE clinic_id=clinic ORDER BY random() LIMIT 1),
        uid,
        CURRENT_DATE - floor(random()*180)::int,
        1 + floor(random()*3)::int,
        CASE WHEN random() > 0.5 THEN CURRENT_DATE + (1 + floor(random()*60)::int) ELSE NULL END,
        'LOTE-' || lpad(floor(random()*10000)::text, 6, '0')
      );
      created_vacc_records := created_vacc_records + 1;
    END LOOP;
  END IF;

  RETURN json_build_object(
    'clinic_id', clinic,
    'created_clients', created_clients,
    'created_pets', created_pets,
    'created_products', created_products,
    'created_vaccines', created_vaccines,
    'created_services', created_services,
    'created_appts', created_appts,
    'created_sales', created_sales,
    'created_vacc_records', created_vacc_records
  );
END;
$$;