-- Fix RLS policy for medical_records to allow all clinic users to insert
DROP POLICY IF EXISTS "Veterinarians can insert medical records" ON public.medical_records;

CREATE POLICY "Users can insert medical records in their clinic"
ON public.medical_records
FOR INSERT
TO authenticated
WITH CHECK (clinic_id = get_user_clinic_id(auth.uid()));

-- Also add UPDATE and DELETE policies for better functionality
CREATE POLICY "Users can update medical records in their clinic"
ON public.medical_records
FOR UPDATE
TO authenticated
USING (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can delete medical records in their clinic"
ON public.medical_records
FOR DELETE
TO authenticated
USING (clinic_id = get_user_clinic_id(auth.uid()));