import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Search, Pill, Syringe, ShoppingCart, Calendar, FileText, ClipboardList, Activity, DollarSign, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

export default function Atendimentos() {
  const [records, setRecords] = useState<any[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [queueAppointments, setQueueAppointments] = useState<any[]>([]);
  
  const [open, setOpen] = useState(false);
  const [viewRecordOpen, setViewRecordOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [recordDetails, setRecordDetails] = useState<any>(null);
  const [triageOpen, setTriageOpen] = useState(false);
  const [financialOpen, setFinancialOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState<string>("todos");
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from('profiles').select('nome').eq('id', user.id).single();
    const veterinario = profile?.nome || 'Dr. Veterinário';

    const [recordsRes, clientsRes, petsRes, productsRes, vaccinesRes, servicesRes, appointmentsRes, queueRes] = await Promise.all([
      supabase.from('medical_records').select('*, pets(nome, clients(nome))').order('created_at', { ascending: false }).limit(50),
      supabase.from('clients').select('id, nome').order('nome'),
      supabase.from('pets').select('id, nome, especie, client_id').order('nome'),
      supabase.from('products').select('id, nome, preco_venda, estoque_atual').eq('ativo', true).order('nome'),
      supabase.from('vaccines').select('id, nome, fabricante').order('nome'),
      supabase.from('service_types').select('id, nome, preco_base, categoria').eq('ativo', true).order('nome'),
      supabase.from('appointments').select('*, pets(nome), clients(nome), service_types(nome)').gte('inicio', new Date().toISOString()).order('inicio').limit(10),
      supabase.from('appointments').select('*, pets(nome, especie), clients(nome), service_types(nome, categoria)').gte('inicio', new Date().toISOString().split('T')[0]).order('inicio').limit(50)
    ]);

    setRecords(recordsRes.data || []);
    setClients(clientsRes.data || []);
    setPets(petsRes.data || []);
    setProducts(productsRes.data || []);
    setVaccines(vaccinesRes.data || []);
    setServices(servicesRes.data || []);
    setAppointments(appointmentsRes.data || []);
    
    // Mapear dados da fila com informações adicionais
    const mappedQueue = (queueRes.data || []).map(apt => ({
      ...apt,
      veterinario: veterinario,
      hora: format(new Date(apt.inicio), "HH:mm", { locale: ptBR }),
      status_display: apt.status === 'agendado' ? 'Aguardando atendimento' : 
                     apt.status === 'concluido' ? 'Concluído' : 
                     apt.status === 'em_andamento' ? 'Entrada solicitada' : 'Solicitar entrada'
    }));
    setQueueAppointments(mappedQueue);
  };

  const filteredPets = pets.filter(p => p.client_id === selectedClient);

  const addProduct = () => {
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

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
  };

  const addService = () => {
    const service = services.find(s => s.id === selectedService);
    if (!service) return;

    setSaleItems([...saleItems, {
      tipo: 'servico',
      service_type_id: service.id,
      descricao: service.nome,
      quantidade: 1,
      preco_unitario: service.preco_base,
      total: service.preco_base
    }]);
    setSelectedService("");
  };

  const removeItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedClient || !selectedPet || !tipoAtendimento) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userRole } = await supabase.from('user_roles').select('clinic_id').eq('user_id', user.id).single();
      if (!userRole) return;

      const { data: location } = await supabase.from('locations').select('id').eq('clinic_id', userRole.clinic_id).single();
      if (!location) return;

      // Criar prontuário médico
      const { data: record, error: recordError } = await supabase.from('medical_records').insert({
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
      }).select().single();

      if (recordError) throw recordError;

      // Registrar vacina se selecionada
      if (selectedVaccine) {
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

      // Criar venda se houver itens
      if (saleItems.length > 0) {
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

        // Inserir itens da venda
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

        // Registrar pagamento
        await supabase.from('payments').insert({
          clinic_id: userRole.clinic_id,
          sale_id: sale.id,
          valor: totalBruto,
          metodo: 'dinheiro',
          status: 'aprovado'
        });
      }

      toast.success("Atendimento registrado com sucesso!");
      setOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast.error("Erro ao salvar atendimento: " + error.message);
    }
  };

  const resetForm = () => {
    setSelectedClient("");
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

  const viewRecordDetails = async (record: any) => {
    setSelectedRecord(record);
    
    // Buscar detalhes completos do atendimento
    const [vaccinationsRes, salesRes] = await Promise.all([
      supabase
        .from('vaccination_records')
        .select('*, vaccines(nome, fabricante)')
        .eq('pet_id', record.pet_id)
        .eq('data_aplicacao', new Date(record.created_at).toISOString().split('T')[0]),
      supabase
        .from('sales')
        .select('*, sale_items(*, products(nome), service_types(nome))')
        .eq('client_id', record.pets?.clients?.id || '')
        .gte('created_at', new Date(new Date(record.created_at).getTime() - 60000).toISOString())
        .lte('created_at', new Date(new Date(record.created_at).getTime() + 60000).toISOString())
    ]);

    setRecordDetails({
      vaccinations: vaccinationsRes.data || [],
      sales: salesRes.data || []
    });
    
    setViewRecordOpen(true);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'agendado': return 'secondary';
      case 'em_andamento': return 'destructive';
      case 'concluido': return 'default';
      default: return 'outline';
    }
  };

  const filteredQueue = activeFilter === "todos" 
    ? queueAppointments 
    : queueAppointments.filter(apt => {
        const categoria = apt.service_types?.categoria?.toLowerCase();
        if (activeFilter === "laboratorio") return categoria === "exame";
        if (activeFilter === "consulta") return categoria === "consulta";
        if (activeFilter === "banho") return categoria === "banho" || categoria === "tosa";
        if (activeFilter === "cirurgia") return categoria === "cirurgia";
        return true;
      });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Fila de Espera</h1>
          <p className="text-muted-foreground">Gerenciamento de atendimentos e esteira de trabalho</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Atendimento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Atendimento Médico Veterinário</DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="paciente" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="paciente">Paciente</TabsTrigger>
                <TabsTrigger value="anamnese">Anamnese</TabsTrigger>
                <TabsTrigger value="vacinas">Vacinas</TabsTrigger>
                <TabsTrigger value="produtos">Produtos</TabsTrigger>
                <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
              </TabsList>

              <TabsContent value="paciente" className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="cliente">Cliente/Tutor *</Label>
                    <Select value={selectedClient} onValueChange={setSelectedClient}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="pet">Pet *</Label>
                    <Select value={selectedPet} onValueChange={setSelectedPet} disabled={!selectedClient}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o pet" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredPets.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.nome} ({p.especie})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="tipo">Tipo de Atendimento *</Label>
                    <Select value={tipoAtendimento} onValueChange={setTipoAtendimento}>
                      <SelectTrigger>
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
                </div>
              </TabsContent>

              <TabsContent value="anamnese" className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="anamnese">Subjetivo (Anamnese)</Label>
                    <Textarea
                      id="anamnese"
                      placeholder="Queixa principal, histórico..."
                      value={anamnese}
                      onChange={(e) => setAnamnese(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="exame">Objetivo (Exame Físico)</Label>
                    <Textarea
                      id="exame"
                      placeholder="Temperatura, FC, FR, mucosas, palpação..."
                      value={exame}
                      onChange={(e) => setExame(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="diagnostico">Avaliação (Diagnóstico)</Label>
                    <Textarea
                      id="diagnostico"
                      placeholder="Diagnóstico presuntivo ou definitivo..."
                      value={diagnostico}
                      onChange={(e) => setDiagnostico(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="tratamento">Plano (Tratamento)</Label>
                    <Textarea
                      id="tratamento"
                      placeholder="Medicações, procedimentos, recomendações..."
                      value={tratamento}
                      onChange={(e) => setTratamento(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="vacinas" className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="vacina">Vacina</Label>
                    <Select value={selectedVaccine} onValueChange={setSelectedVaccine}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a vacina" />
                      </SelectTrigger>
                      <SelectContent>
                        {vaccines.map(v => (
                          <SelectItem key={v.id} value={v.id}>{v.nome} - {v.fabricante}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedVaccine && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="dose">Dose</Label>
                          <Input
                            type="number"
                            id="dose"
                            value={dose}
                            onChange={(e) => setDose(parseInt(e.target.value))}
                            min="1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="lote">Lote</Label>
                          <Input
                            id="lote"
                            value={lote}
                            onChange={(e) => setLote(e.target.value)}
                            placeholder="Número do lote"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="proxima">Próxima Dose</Label>
                        <Input
                          type="date"
                          id="proxima"
                          value={proximaData}
                          onChange={(e) => setProximaData(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="produtos" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label>Produto</Label>
                      <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.nome} - R$ {p.preco_venda.toFixed(2)} (Est: {p.estoque_atual})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-24">
                      <Label>Qtd</Label>
                      <Input
                        type="number"
                        value={quantidade}
                        onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)}
                        min="1"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={addProduct} disabled={!selectedProduct}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label>Serviço</Label>
                      <Select value={selectedService} onValueChange={setSelectedService}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione serviço" />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map(s => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.nome} - R$ {s.preco_base.toFixed(2)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button onClick={addService} disabled={!selectedService}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {saleItems.length > 0 && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Itens Adicionados</h4>
                      <div className="space-y-2">
                        {saleItems.map((item, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span>{item.descricao} x{item.quantidade}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">R$ {item.total.toFixed(2)}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(index)}
                              >
                                ✕
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="financeiro" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Resumo Financeiro</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {saleItems.length > 0 ? (
                      <>
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">Itens do Atendimento:</h4>
                          {saleItems.map((item, index) => (
                            <div key={index} className="flex justify-between items-center py-2 border-b">
                              <div className="flex-1">
                                <div className="font-medium">{item.descricao}</div>
                                <div className="text-sm text-muted-foreground">
                                  {item.tipo === 'produto' ? 'Produto' : 'Serviço'} • Qtd: {item.quantidade} • R$ {item.preco_unitario.toFixed(2)} cada
                                </div>
                              </div>
                              <div className="font-bold">R$ {item.total.toFixed(2)}</div>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between text-lg pt-2 border-t-2">
                          <span className="font-semibold">Total de Produtos/Serviços:</span>
                          <span className="font-bold text-primary">R$ {totalVenda.toFixed(2)}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {saleItems.length} item(ns) adicionado(s)
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Nenhum produto ou serviço adicionado</p>
                        <p className="text-sm">Vá para a aba "Produtos" para adicionar itens</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {appointments.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Próximos Agendamentos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {appointments.slice(0, 5).map(apt => (
                          <div key={apt.id} className="text-sm border-l-2 border-primary pl-2">
                            <div className="font-medium">{apt.pets?.nome} - {apt.clients?.nome}</div>
                            <div className="text-muted-foreground">
                              {format(new Date(apt.inicio), "dd/MM/yyyy HH:mm", { locale: ptBR })} - {apt.service_types?.nome}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit}>Salvar Atendimento</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Esteira de Atendimento */}
      <Card>
        <CardHeader>
          <CardTitle>Fila</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex gap-2 mb-4">
            <Button 
              variant={activeFilter === "todos" ? "default" : "outline"}
              onClick={() => setActiveFilter("todos")}
            >
              TODOS
            </Button>
            <Button 
              variant={activeFilter === "laboratorio" ? "default" : "outline"}
              onClick={() => setActiveFilter("laboratorio")}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              LABORATÓRIO
            </Button>
            <Button 
              variant={activeFilter === "consulta" ? "default" : "outline"}
              onClick={() => setActiveFilter("consulta")}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              CONSULTA CLÍNICO
            </Button>
            <Button 
              variant={activeFilter === "banho" ? "default" : "outline"}
              onClick={() => setActiveFilter("banho")}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              BANHO E TOSA
            </Button>
            <Button 
              variant={activeFilter === "cirurgia" ? "default" : "outline"}
              onClick={() => setActiveFilter("cirurgia")}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              CIRURGIA
            </Button>
          </div>

          {/* Tabela da Fila */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Animal</TableHead>
                <TableHead>Procedimento</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Veterinário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQueue.map((apt) => (
                <TableRow key={apt.id}>
                  <TableCell className="font-medium">{apt.clients?.nome || 'N/A'}</TableCell>
                  <TableCell>{apt.pets?.nome || 'N/A'}</TableCell>
                  <TableCell>{apt.service_types?.nome || 'N/A'}</TableCell>
                  <TableCell>{apt.hora}</TableCell>
                  <TableCell>{apt.veterinario}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(apt.status)}>
                      {apt.status_display}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      {/* Prontuário */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 bg-teal-600 hover:bg-teal-700 text-white"
                        onClick={() => {
                          setSelectedAppointment(apt);
                          setViewRecordOpen(true);
                        }}
                        title="Prontuário do paciente"
                      >
                        <ClipboardList className="h-4 w-4" />
                      </Button>
                      
                      {/* Triagem */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 bg-teal-600 hover:bg-teal-700 text-white"
                        onClick={() => {
                          setSelectedAppointment(apt);
                          setTriageOpen(true);
                        }}
                        title="Dados de Triagem"
                      >
                        <Activity className="h-4 w-4" />
                      </Button>
                      
                      {/* Financeiro */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => {
                          setSelectedAppointment(apt);
                          setFinancialOpen(true);
                        }}
                        title="Resumo Financeiro"
                      >
                        <DollarSign className="h-4 w-4" />
                      </Button>
                      
                      {/* Editar */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-accent"
                        onClick={() => {
                          setSelectedAppointment(apt);
                          setEditOpen(true);
                        }}
                        title="Editar Atendimento"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Atendimentos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Pet</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => viewRecordDetails(record)}
                      className="h-8 w-8 p-0"
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <TableCell>
                    {format(new Date(record.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>{record.pets?.nome}</TableCell>
                  <TableCell>{record.pets?.clients?.nome}</TableCell>
                  <TableCell>{record.tipo_atendimento}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de visualização do atendimento */}
      <Dialog open={viewRecordOpen} onOpenChange={setViewRecordOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Atendimento</DialogTitle>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-6">
              {/* Informações do Paciente */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações do Paciente</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Pet</Label>
                    <p className="font-medium">{selectedRecord.pets?.nome}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Cliente/Tutor</Label>
                    <p className="font-medium">{selectedRecord.pets?.clients?.nome}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Data do Atendimento</Label>
                    <p className="font-medium">
                      {format(new Date(selectedRecord.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Tipo de Atendimento</Label>
                    <p className="font-medium">{selectedRecord.tipo_atendimento}</p>
                  </div>
                </CardContent>
              </Card>

              {/* SOAP */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Prontuário Médico (SOAP)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedRecord.soap?.subjetivo && (
                    <div>
                      <Label className="text-muted-foreground font-semibold">Subjetivo (Anamnese)</Label>
                      <p className="mt-1 whitespace-pre-wrap">{selectedRecord.soap.subjetivo}</p>
                    </div>
                  )}
                  {selectedRecord.soap?.objetivo && (
                    <div>
                      <Label className="text-muted-foreground font-semibold">Objetivo (Exame Físico)</Label>
                      <p className="mt-1 whitespace-pre-wrap">{selectedRecord.soap.objetivo}</p>
                    </div>
                  )}
                  {selectedRecord.soap?.avaliacao && (
                    <div>
                      <Label className="text-muted-foreground font-semibold">Avaliação (Diagnóstico)</Label>
                      <p className="mt-1 whitespace-pre-wrap">{selectedRecord.soap.avaliacao}</p>
                    </div>
                  )}
                  {selectedRecord.soap?.plano && (
                    <div>
                      <Label className="text-muted-foreground font-semibold">Plano (Tratamento)</Label>
                      <p className="mt-1 whitespace-pre-wrap">{selectedRecord.soap.plano}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Vacinas */}
              {recordDetails?.vaccinations && recordDetails.vaccinations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Syringe className="h-5 w-5" />
                      Vacinas Aplicadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recordDetails.vaccinations.map((vacc: any) => (
                        <div key={vacc.id} className="border-l-2 border-primary pl-3">
                          <p className="font-medium">{vacc.vaccines?.nome} - {vacc.vaccines?.fabricante}</p>
                          <div className="text-sm text-muted-foreground">
                            Dose: {vacc.dose} • Lote: {vacc.lote || 'N/A'}
                            {vacc.proxima_data && ` • Próxima dose: ${format(new Date(vacc.proxima_data), "dd/MM/yyyy", { locale: ptBR })}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Produtos e Serviços */}
              {recordDetails?.sales && recordDetails.sales.length > 0 && recordDetails.sales[0]?.sale_items?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Produtos e Serviços
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {recordDetails.sales[0].sale_items.map((item: any) => (
                        <div key={item.id} className="flex justify-between items-center py-2 border-b">
                          <div>
                            <p className="font-medium">
                              {item.products?.nome || item.service_types?.nome || item.descricao}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {item.tipo === 'produto' ? 'Produto' : 'Serviço'} • Qtd: {item.quantidade} • R$ {Number(item.preco_unitario).toFixed(2)} cada
                            </p>
                          </div>
                          <p className="font-bold">R$ {Number(item.total).toFixed(2)}</p>
                        </div>
                      ))}
                      <div className="flex justify-between text-lg pt-2 border-t-2 font-semibold">
                        <span>Total:</span>
                        <span className="text-primary">
                          R$ {Number(recordDetails.sales[0].total_liquido).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button onClick={() => setViewRecordOpen(false)}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Triagem */}
      <Dialog open={triageOpen} onOpenChange={setTriageOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dados de Triagem</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Paciente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Nome</Label>
                      <p className="font-medium">{selectedAppointment.pets?.nome}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Espécie</Label>
                      <p className="font-medium">{selectedAppointment.pets?.especie}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Tutor</Label>
                      <p className="font-medium">{selectedAppointment.clients?.nome}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Procedimento</Label>
                      <p className="font-medium">{selectedAppointment.service_types?.nome}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sinais Vitais</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Temperatura (°C)</Label>
                    <Input placeholder="38.5" type="number" step="0.1" />
                  </div>
                  <div>
                    <Label>Frequência Cardíaca (bpm)</Label>
                    <Input placeholder="120" type="number" />
                  </div>
                  <div>
                    <Label>Frequência Respiratória (rpm)</Label>
                    <Input placeholder="30" type="number" />
                  </div>
                  <div>
                    <Label>Peso (kg)</Label>
                    <Input placeholder="5.5" type="number" step="0.1" />
                  </div>
                  <div className="col-span-2">
                    <Label>Observações</Label>
                    <Textarea placeholder="Mucosas róseas, TPC < 2s..." rows={3} />
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setTriageOpen(false)}>Cancelar</Button>
                <Button onClick={() => {
                  toast.success("Dados de triagem salvos!");
                  setTriageOpen(false);
                }}>Salvar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Financeiro */}
      <Dialog open={financialOpen} onOpenChange={setFinancialOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Resumo Financeiro</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Atendimento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Cliente:</span>
                      <span className="font-medium">{selectedAppointment.clients?.nome}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pet:</span>
                      <span className="font-medium">{selectedAppointment.pets?.nome}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Procedimento:</span>
                      <span className="font-medium">{selectedAppointment.service_types?.nome}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Valores</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span>Consulta/Procedimento</span>
                    <span className="font-medium">R$ 150,00</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>Medicamentos</span>
                    <span className="font-medium">R$ 85,00</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>Exames</span>
                    <span className="font-medium">R$ 120,00</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t-2">
                    <span>Total:</span>
                    <span className="text-primary">R$ 355,00</span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={() => setFinancialOpen(false)}>Fechar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Atendimento</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div>
                <Label>Status do Atendimento</Label>
                <Select defaultValue={selectedAppointment.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agendado">Aguardando atendimento</SelectItem>
                    <SelectItem value="em_andamento">Em atendimento</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Horário</Label>
                <Input type="time" defaultValue={selectedAppointment.hora} />
              </div>

              <div>
                <Label>Notas</Label>
                <Textarea 
                  placeholder="Observações sobre o atendimento..."
                  defaultValue={selectedAppointment.notas}
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
                <Button onClick={() => {
                  toast.success("Atendimento atualizado!");
                  setEditOpen(false);
                }}>Salvar Alterações</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
