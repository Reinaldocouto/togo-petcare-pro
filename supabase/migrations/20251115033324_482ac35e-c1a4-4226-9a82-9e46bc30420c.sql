-- Criar bucket para armazenar scans de carteiras de vacinação
INSERT INTO storage.buckets (id, name, public)
VALUES ('vaccination_scans', 'vaccination_scans', false);

-- RLS policies para o bucket vaccination_scans
CREATE POLICY "Usuários podem ver scans de vacinas da sua clínica"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'vaccination_scans' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT pets.id FROM pets
    WHERE pets.clinic_id = get_user_clinic_id(auth.uid())
  )
);

CREATE POLICY "Usuários podem fazer upload de scans de vacinas"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vaccination_scans' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT pets.id FROM pets
    WHERE pets.clinic_id = get_user_clinic_id(auth.uid())
  )
);

CREATE POLICY "Usuários podem deletar scans de vacinas da sua clínica"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'vaccination_scans' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT pets.id FROM pets
    WHERE pets.clinic_id = get_user_clinic_id(auth.uid())
  )
);