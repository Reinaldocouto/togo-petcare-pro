import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Syringe, ShoppingCart, Calendar, Mic, Square, Play, Pause, Loader2 } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Client {
  id: string;
  nome: string;
}

interface Pet {
  id: string;
  nome: string;
  especie: string;
  client_id: string;
}

interface Product {
  id: string;
  nome: string;
  preco_venda: number;
  estoque_atual: number;
}

interface Vaccine {
  id: string;
  nome: string;
  fabricante: string;
}

interface ServiceType {
  id: string;
  nome: string;
  preco_base: number;
}

interface SaleItem {
  tipo: 'produto' | 'servico';
  product_id?: string;
  service_type_id?: string;
  descricao: string;
  quantidade: number;
  preco_unitario: number;
  total: number;
}

interface AtendimentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefilledClientId?: string;
  onSave?: () => void;
}

export function AtendimentoModal({ open, onOpenChange, prefilledClientId, onSave }: AtendimentoModalProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [services, setServices] = useState<ServiceType[]>([]);
  
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedPet, setSelectedPet] = useState("");
  const [tipoAtendimento, setTipoAtendimento] = useState("");
  const [anamnese, setAnamnese] = useState("");
  const [exame, setExame] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [tratamento, setTratamento] = useState("");
  
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedVaccine, setSelectedVaccine] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [dose, setDose] = useState(1);
  const [lote, setLote] = useState("");
  const [proximaData, setProximaData] = useState("");
  
  // Speech recognition
  const { startListening, isListening, isReady } = useSpeechRecognition();

  useEffect(() => {
    if (open) {
      loadData();
      if (prefilledClientId) {
        setSelectedClient(prefilledClientId);
      }
    }
  }, [open, prefilledClientId]);

  const loadData = async () => {
    const [clientsRes, petsRes, productsRes, vaccinesRes, servicesRes] = await Promise.all([
      supabase.from('clients').select('id, nome').order('nome'),
      supabase.from('pets').select('id, nome, especie, client_id').order('nome'),
      supabase.from('products').select('id, nome, preco_venda, estoque_atual').eq('ativo', true).order('nome'),
      supabase.from('vaccines').select('id, nome, fabricante').order('nome'),
      supabase.from('service_types').select('id, nome, preco_base, categoria').eq('ativo', true).order('nome'),
    ]);

    if (clientsRes.data) setClients(clientsRes.data);
    if (petsRes.data) setPets(petsRes.data);
    if (productsRes.data) setProducts(productsRes.data);
    if (vaccinesRes.data) setVaccines(vaccinesRes.data);
    if (servicesRes.data) setServices(servicesRes.data);
  };

  const filteredPets = pets.filter(p => p.client_id === selectedClient);

  const addProduct = () => {
    const product = products.find(p => p.id === selectedProduct);
    if (product && quantidade > 0) {
      setSaleItems([...saleItems, {
        tipo: 'produto',
        product_id: product.id,
        descricao: product.nome,
        quantidade,
        preco_unitario: product.preco_venda,
        total: product.preco_venda * quantidade
      }]);
      setSelectedProduct("");
      setQuantidade(1);
    }
  };

  const addService = () => {
    const service = services.find(s => s.id === selectedService);
    if (service && quantidade > 0) {
      setSaleItems([...saleItems, {
        tipo: 'servico',
        service_type_id: service.id,
        descricao: service.nome,
        quantidade,
        preco_unitario: service.preco_base,
        total: service.preco_base * quantidade
      }]);
      setSelectedService("");
      setQuantidade(1);
    }
  };

  const removeItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!selectedClient || !selectedPet || !tipoAtendimento) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: userRole } = await supabase
        .from('user_roles')
        .select('clinic_id')
        .eq('user_id', user.id)
        .single();

      if (!userRole) throw new Error("Clínica não encontrada");

      // Salvar prontuário médico
      const { data: record, error: recordError } = await supabase
        .from('medical_records')
        .insert({
          clinic_id: userRole.clinic_id,
          pet_id: selectedPet,
          veterinario_id: user.id,
          tipo_atendimento: tipoAtendimento,
          soap: {
            subjetivo: anamnese,
            objetivo: exame,
            avaliacao: diagnostico,
            plano: tratamento
          }
        })
        .select()
        .single();

      if (recordError) throw recordError;

      // Salvar vacinas
      if (selectedVaccine && lote) {
        await supabase.from('vaccination_records').insert({
          clinic_id: userRole.clinic_id,
          pet_id: selectedPet,
          vaccine_id: selectedVaccine,
          aplicador_id: user.id,
          data_aplicacao: new Date().toISOString().split('T')[0],
          dose,
          lote,
          proxima_data: proximaData || null
        });
      }

      // Salvar venda se houver itens
      if (saleItems.length > 0) {
        const { data: location } = await supabase
          .from('locations')
          .select('id')
          .eq('clinic_id', userRole.clinic_id)
          .limit(1)
          .single();

        if (!location) throw new Error("Local não encontrado");

        const totalBruto = saleItems.reduce((sum, item) => sum + item.total, 0);

        const { data: sale, error: saleError } = await supabase.from('sales').insert({
          clinic_id: userRole.clinic_id,
          location_id: location.id,
          client_id: selectedClient,
          created_by: user.id,
          total_bruto: totalBruto,
          desconto: 0,
          total_liquido: totalBruto,
          status: 'fechada'
        }).select().single();

        if (saleError) throw saleError;

        const itemsToInsert = saleItems.map(item => ({
          clinic_id: userRole.clinic_id,
          sale_id: sale.id,
          tipo: item.tipo,
          product_id: item.product_id,
          service_type_id: item.service_type_id,
          descricao: item.descricao,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          total: item.total
        }));

        await supabase.from('sale_items').insert(itemsToInsert);

        await supabase.from('payments').insert({
          clinic_id: userRole.clinic_id,
          sale_id: sale.id,
          valor: totalBruto,
          metodo: 'dinheiro',
          status: 'aprovado'
        });
      }

      toast.success("Atendimento registrado com sucesso!");
      resetForm();
      onOpenChange(false);
      if (onSave) onSave();
    } catch (error: any) {
      toast.error("Erro ao salvar atendimento: " + error.message);
    }
  };

  const resetForm = () => {
    if (!prefilledClientId) {
      setSelectedClient("");
    }
    setSelectedPet("");
    setTipoAtendimento("");
    setAnamnese("");
    setExame("");
    setDiagnostico("");
    setTratamento("");
    setSaleItems([]);
    setSelectedProduct("");
    setSelectedVaccine("");
    setSelectedService("");
    setQuantidade(1);
    setDose(1);
    setLote("");
    setProximaData("");
  };

  const totalVenda = saleItems.reduce((sum, item) => sum + item.total, 0);

  const handleStartVoiceInput = (field: 'anamnese' | 'exame' | 'diagnostico' | 'tratamento') => {
    const fieldSetters = {
      anamnese: setAnamnese,
      exame: setExame,
      diagnostico: setDiagnostico,
      tratamento: setTratamento
    };

    startListening(
      (transcript) => {
        const setter = fieldSetters[field];
        setter(prev => prev ? `${prev}\n${transcript}` : transcript);
        toast.success("Texto capturado com sucesso");
      },
      (error) => {
        toast.error(`Erro no reconhecimento: ${error}`);
      }
    );
  };

  const formatRecordingTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full max-h-screen h-screen overflow-y-auto p-0">
        <div className="p-6">
          <DialogHeader>
            <DialogTitle>Novo Atendimento Médico Veterinário</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="paciente" className="w-full mt-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="paciente">Paciente</TabsTrigger>
              <TabsTrigger value="anamnese">Anamnese</TabsTrigger>
              <TabsTrigger value="vacinas">Vacinas</TabsTrigger>
              <TabsTrigger value="produtos">Produtos</TabsTrigger>
              <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            </TabsList>

            <TabsContent value="paciente" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client">Cliente/Tutor *</Label>
                <Select value={selectedClient} onValueChange={setSelectedClient} disabled={!!prefilledClientId}>
                  <SelectTrigger id="client">
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>{client.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pet">Pet *</Label>
                <Select value={selectedPet} onValueChange={setSelectedPet} disabled={!selectedClient}>
                  <SelectTrigger id="pet">
                    <SelectValue placeholder="Selecione o pet" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredPets.map(pet => (
                      <SelectItem key={pet.id} value={pet.id}>
                        {pet.nome} - {pet.especie}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Atendimento *</Label>
                <Select value={tipoAtendimento} onValueChange={setTipoAtendimento}>
                  <SelectTrigger id="tipo">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Consulta">Consulta</SelectItem>
                    <SelectItem value="Retorno">Retorno</SelectItem>
                    <SelectItem value="Emergência">Emergência</SelectItem>
                    <SelectItem value="Cirurgia">Cirurgia</SelectItem>
                    <SelectItem value="Exame">Exame</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="anamnese" className="space-y-4">
              <Alert>
                <AlertDescription>
                  <p className="font-medium mb-2">💡 Dica: Use reconhecimento de voz</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Clique no botão "🎤 Ditar" em cada campo para usar ditado por voz em português (pt-BR).
                  </p>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="anamnese">Anamnese (Subjetivo)</Label>
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm"
                    onClick={() => handleStartVoiceInput('anamnese')}
                    disabled={isListening}
                  >
                    <Mic className={`h-4 w-4 mr-2 ${isListening ? 'text-red-500 animate-pulse' : ''}`} />
                    {isListening && !isReady && 'Preparando...'}
                    {isListening && isReady && '🔴 Pode falar!'}
                    {!isListening && '🎤 Ditar'}
                  </Button>
                </div>
                <Textarea
                  id="anamnese"
                  value={anamnese}
                  onChange={(e) => setAnamnese(e.target.value)}
                  placeholder="Queixa principal, histórico... (ou clique em '🎤 Ditar' para usar voz)"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="exame">Exame Clínico (Objetivo)</Label>
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm"
                    onClick={() => handleStartVoiceInput('exame')}
                    disabled={isListening}
                  >
                    <Mic className={`h-4 w-4 mr-2 ${isListening ? 'text-red-500 animate-pulse' : ''}`} />
                    {isListening && !isReady && 'Preparando...'}
                    {isListening && isReady && '🔴 Pode falar!'}
                    {!isListening && '🎤 Ditar'}
                  </Button>
                </div>
                <Textarea
                  id="exame"
                  value={exame}
                  onChange={(e) => setExame(e.target.value)}
                  placeholder="Temperatura, FC, FR, mucosas... (ou clique em '🎤 Ditar' para usar voz)"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="diagnostico">Diagnóstico (Avaliação)</Label>
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm"
                    onClick={() => handleStartVoiceInput('diagnostico')}
                    disabled={isListening}
                  >
                    <Mic className={`h-4 w-4 mr-2 ${isListening ? 'text-red-500 animate-pulse' : ''}`} />
                    {isListening && !isReady && 'Preparando...'}
                    {isListening && isReady && '🔴 Pode falar!'}
                    {!isListening && '🎤 Ditar'}
                  </Button>
                </div>
                <Textarea
                  id="diagnostico"
                  value={diagnostico}
                  onChange={(e) => setDiagnostico(e.target.value)}
                  placeholder="Diagnóstico presuntivo ou definitivo... (ou clique em '🎤 Ditar' para usar voz)"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="tratamento">Tratamento (Plano)</Label>
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm"
                    onClick={() => handleStartVoiceInput('tratamento')}
                    disabled={isListening}
                  >
                    <Mic className={`h-4 w-4 mr-2 ${isListening ? 'text-red-500 animate-pulse' : ''}`} />
                    {isListening && !isReady && 'Preparando...'}
                    {isListening && isReady && '🔴 Pode falar!'}
                    {!isListening && '🎤 Ditar'}
                  </Button>
                </div>
                <Textarea
                  id="tratamento"
                  value={tratamento}
                  onChange={(e) => setTratamento(e.target.value)}
                  placeholder="Medicações, procedimentos, orientações... (ou clique em '🎤 Ditar' para usar voz)"
                  rows={4}
                />
              </div>
            </TabsContent>

            <TabsContent value="vacinas" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Syringe className="h-5 w-5" />
                <h3 className="font-semibold">Aplicação de Vacinas</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vaccine">Vacina</Label>
                  <Select value={selectedVaccine} onValueChange={setSelectedVaccine}>
                    <SelectTrigger id="vaccine">
                      <SelectValue placeholder="Selecione a vacina" />
                    </SelectTrigger>
                    <SelectContent>
                      {vaccines.map(vaccine => (
                        <SelectItem key={vaccine.id} value={vaccine.id}>
                          {vaccine.nome} - {vaccine.fabricante}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dose">Dose</Label>
                  <Input
                    id="dose"
                    type="number"
                    min="1"
                    value={dose}
                    onChange={(e) => setDose(parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lote">Lote</Label>
                  <Input
                    id="lote"
                    value={lote}
                    onChange={(e) => setLote(e.target.value)}
                    placeholder="Número do lote"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proxima">Próxima Aplicação</Label>
                  <Input
                    id="proxima"
                    type="date"
                    value={proximaData}
                    onChange={(e) => setProximaData(e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="produtos" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCart className="h-5 w-5" />
                <h3 className="font-semibold">Produtos e Serviços</h3>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product">Produto</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger id="product">
                      <SelectValue placeholder="Selecione o produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.nome} - R$ {product.preco_venda.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantidade">Quantidade</Label>
                  <Input
                    id="quantidade"
                    type="number"
                    min="1"
                    value={quantidade}
                    onChange={(e) => setQuantidade(parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button onClick={addProduct} className="w-full" type="button">
                    Adicionar Produto
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="service">Serviço</Label>
                  <Select value={selectedService} onValueChange={setSelectedService}>
                    <SelectTrigger id="service">
                      <SelectValue placeholder="Selecione o serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map(service => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.nome} - R$ {service.preco_base.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button onClick={addService} className="w-full" type="button">
                    Adicionar Serviço
                  </Button>
                </div>
              </div>

              {saleItems.length > 0 && (
                <div className="border rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold mb-2">Itens Adicionados</h4>
                  {saleItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b">
                      <div>
                        <p className="font-medium">{item.descricao}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantidade}x R$ {item.preco_unitario.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-semibold">R$ {item.total.toFixed(2)}</p>
                        <Button variant="ghost" size="sm" onClick={() => removeItem(index)}>
                          Remover
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="financeiro" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5" />
                <h3 className="font-semibold">Resumo Financeiro</h3>
              </div>

              <div className="border rounded-lg p-6 space-y-4">
                <div className="flex justify-between text-lg">
                  <span>Subtotal:</span>
                  <span>R$ {totalVenda.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span>Desconto:</span>
                  <span>R$ 0,00</span>
                </div>
                <div className="border-t pt-4 flex justify-between text-2xl font-bold">
                  <span>Total:</span>
                  <span>R$ {totalVenda.toFixed(2)}</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                O pagamento será registrado como dinheiro após salvar o atendimento.
              </p>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-4 mt-6">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar Atendimento
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
