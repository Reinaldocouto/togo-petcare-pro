import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Upload, Loader2, Camera, CheckCircle2, XCircle, Edit, Trash2 } from "lucide-react";
import Tesseract from "tesseract.js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface VaccinationRecord {
  vaccine_name: string;
  data_aplicacao: string;
  dose: number;
  proxima_data: string | null;
  lote: string | null;
  confidence: number;
}

interface VaccinationOCRUploadProps {
  petId: string;
  onSuccess: () => void;
}

export function VaccinationOCRUpload({ petId, onSuccess }: VaccinationOCRUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedRecords, setExtractedRecords] = useState<VaccinationRecord[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const parseVaccinationLine = (line: string): VaccinationRecord | null => {
    // Limpar linha
    line = line.trim();
    if (line.length < 5) return null;

    // Regex para datas no formato dd/mm/yyyy ou dd-mm-yyyy
    const dateRegex = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/g;
    const dates = [...line.matchAll(dateRegex)].map(match => {
      const day = match[1].padStart(2, '0');
      const month = match[2].padStart(2, '0');
      const year = match[3];
      return `${year}-${month}-${day}`;
    });

    if (dates.length === 0) return null;

    // Extrair nome da vacina (tudo antes da primeira data)
    const firstDateIndex = line.search(dateRegex);
    let vaccineName = line.substring(0, firstDateIndex).trim();
    
    // Limpar caracteres especiais do nome
    vaccineName = vaccineName.replace(/[^\w\s\-]/g, '').trim();
    
    if (!vaccineName) return null;

    // Extrair dose
    const doseMatch = line.match(/(\d+)[ªa°]\s*dose/i);
    const dose = doseMatch ? parseInt(doseMatch[1]) : 1;

    // Extrair lote
    const loteMatch = line.match(/lote[\s:]*([A-Z0-9\-]+)/i);
    const lote = loteMatch ? loteMatch[1].trim() : null;

    // Determinar data de aplicação e próxima data
    const data_aplicacao = dates[0];
    const proxima_data = dates.length > 1 ? dates[1] : null;

    return {
      vaccine_name: vaccineName,
      data_aplicacao,
      dose,
      proxima_data,
      lote,
      confidence: 0.85, // Confiança estimada
    };
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem (PNG, JPG ou JPEG)",
      });
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const processImage = async () => {
    if (!selectedFile) return;

    if (!petId) {
      toast({
        variant: "destructive",
        title: "Pet não selecionado",
        description: "É necessário ter um pet cadastrado para processar a carteira de vacinação.",
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      // 1. Upload da imagem para o Supabase Storage
      const filePath = `${petId}/${Date.now()}-${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('vaccination_scans')
        .upload(filePath, selectedFile, { upsert: false });

      if (uploadError) throw uploadError;

      setProgress(25);

      // 2. Processar OCR com Tesseract.js
      const { data: { text } } = await Tesseract.recognize(
        selectedFile,
        'por',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setProgress(25 + (m.progress * 50));
            }
          }
        }
      );

      setProgress(75);

      console.log("Texto OCR extraído:", text);

      // 3. Parse do texto extraído
      const lines = text.split('\n').filter(line => line.trim().length > 0);
      const records: VaccinationRecord[] = [];

      for (const line of lines) {
        const record = parseVaccinationLine(line);
        if (record) {
          records.push(record);
        }
      }

      setProgress(90);

      if (records.length === 0) {
        toast({
          variant: "destructive",
          title: "Nenhum registro encontrado",
          description: "Não foi possível extrair dados de vacinação da imagem. Tente uma imagem mais nítida ou adicione manualmente.",
        });
        setIsProcessing(false);
        return;
      }

      setExtractedRecords(records);
      setShowReview(true);
      setProgress(100);

      toast({
        title: "Processamento concluído!",
        description: `${records.length} registro(s) de vacinação encontrado(s). Revise os dados antes de salvar.`,
      });

    } catch (error) {
      console.error("Erro ao processar imagem:", error);
      toast({
        variant: "destructive",
        title: "Erro ao processar imagem",
        description: "Ocorreu um erro ao processar a imagem. Tente novamente.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const saveRecords = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data: clinicData } = await supabase
        .from('user_roles')
        .select('clinic_id')
        .eq('user_id', userData.user?.id)
        .single();

      // Para cada registro, tentar encontrar a vacina correspondente ou criar nova
      for (const record of extractedRecords) {
        // Buscar vacina pelo nome
        let { data: vaccines } = await supabase
          .from('vaccines')
          .select('id')
          .eq('clinic_id', clinicData?.clinic_id)
          .ilike('nome', `%${record.vaccine_name}%`)
          .limit(1);

        let vaccineId: string;

        if (!vaccines || vaccines.length === 0) {
          // Criar nova vacina se não existir
          const { data: newVaccine, error: vaccineError } = await supabase
            .from('vaccines')
            .insert({
              clinic_id: clinicData?.clinic_id,
              nome: record.vaccine_name,
              doses: 1,
            })
            .select('id')
            .single();

          if (vaccineError) throw vaccineError;
          vaccineId = newVaccine.id;
        } else {
          vaccineId = vaccines[0].id;
        }

        // Inserir registro de vacinação
        const { error: insertError } = await supabase
          .from('vaccination_records')
          .insert({
            clinic_id: clinicData?.clinic_id,
            pet_id: petId,
            vaccine_id: vaccineId,
            aplicador_id: userData.user?.id,
            data_aplicacao: record.data_aplicacao,
            dose: record.dose,
            proxima_data: record.proxima_data,
            lote: record.lote,
          });

        if (insertError) throw insertError;
      }

      toast({
        title: "Sucesso!",
        description: `${extractedRecords.length} registro(s) de vacinação salvos com sucesso!`,
      });

      setShowReview(false);
      setExtractedRecords([]);
      setSelectedFile(null);
      setPreviewUrl(null);
      onSuccess();

    } catch (error) {
      console.error("Erro ao salvar registros:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar os registros. Tente novamente.",
      });
    }
  };

  const updateRecord = (index: number, field: keyof VaccinationRecord, value: any) => {
    setExtractedRecords(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeRecord = (index: number) => {
    setExtractedRecords(prev => prev.filter((_, i) => i !== index));
  };

  const clearImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setExtractedRecords([]);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <CardTitle>Adicionar Vacinas via OCR</CardTitle>
          </div>
          <CardDescription>
            Envie uma foto da carteira de vacinação e o sistema extrairá os dados automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vaccination-image">Imagem da Carteira de Vacinação</Label>
            <Input
              id="vaccination-image"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isProcessing}
            />
            <p className="text-xs text-muted-foreground">
              Formatos aceitos: PNG, JPG, JPEG. Máximo 20MB.
            </p>
          </div>

          {previewUrl && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Pré-visualização</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearImage}
                  disabled={isProcessing}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remover Imagem
                </Button>
              </div>
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full h-auto max-h-64 rounded-lg border"
              />
            </div>
          )}

          <Button
            onClick={processImage}
            disabled={!selectedFile || isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando... {Math.round(progress)}%
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Processar Imagem
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Dialog de revisão */}
      <Dialog open={showReview} onOpenChange={setShowReview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Revisar Dados Extraídos</DialogTitle>
            <DialogDescription>
              Revise e edite os dados extraídos antes de salvar. Você pode corrigir qualquer informação ou remover registros incorretos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {extractedRecords.map((record, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Registro {index + 1}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={record.confidence > 0.7 ? "default" : "destructive"}>
                        Confiança: {Math.round(record.confidence * 100)}%
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRecord(index)}
                      >
                        <XCircle className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome da Vacina</Label>
                    <Input
                      value={record.vaccine_name}
                      onChange={(e) => updateRecord(index, 'vaccine_name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data de Aplicação</Label>
                    <Input
                      type="date"
                      value={record.data_aplicacao}
                      onChange={(e) => updateRecord(index, 'data_aplicacao', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Dose</Label>
                    <Input
                      type="number"
                      min="1"
                      value={record.dose}
                      onChange={(e) => updateRecord(index, 'dose', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Próxima Data (Reforço)</Label>
                    <Input
                      type="date"
                      value={record.proxima_data || ''}
                      onChange={(e) => updateRecord(index, 'proxima_data', e.target.value || null)}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Lote</Label>
                    <Input
                      value={record.lote || ''}
                      onChange={(e) => updateRecord(index, 'lote', e.target.value || null)}
                      placeholder="Opcional"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Separator />

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setShowReview(false)}>
              Cancelar
            </Button>
            <Button onClick={saveRecords} disabled={extractedRecords.length === 0}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Salvar {extractedRecords.length} Registro(s)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
