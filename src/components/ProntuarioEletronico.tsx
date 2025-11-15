import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Stethoscope, Calendar, Syringe, FileText, DollarSign, PlusCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { VaccinationOCRUpload } from "./VaccinationOCRUpload";
import { useToast } from "@/hooks/use-toast";

interface ProntuarioEletronicoProps {
  client: any;
  open: boolean;
  onClose: () => void;
}

export function ProntuarioEletronico({ client, open, onClose }: ProntuarioEletronicoProps) {
  const { toast } = useToast();
  const [pets, setPets] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [vaccinations, setVaccinations] = useState<any[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPetDialog, setShowAddPetDialog] = useState(false);
  const [petForm, setPetForm] = useState({
    nome: "",
    especie: "",
    raca: "",
    sexo: "",
    nascimento: "",
    cor: "",
    castrado: false,
    microchip: "",
    alergias: "",
  });

  useEffect(() => {
    if (open && client) {
      loadProntuarioData();
    }
  }, [open, client]);

  const loadProntuarioData = async () => {
    setLoading(true);
    try {
      // Carregar pets do cliente
      const { data: petsData } = await supabase
        .from('pets')
        .select('*')
        .eq('client_id', client.id)
        .order('nome');

      setPets(petsData || []);

      // Carregar atendimentos
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select(`
          *,
          pet:pets(nome, especie),
          service_type:service_types(nome)
        `)
        .eq('client_id', client.id)
        .order('inicio', { ascending: false });

      setAppointments(appointmentsData || []);

      // Carregar vacinas (de todos os pets do cliente)
      if (petsData && petsData.length > 0) {
        const petIds = petsData.map(p => p.id);
        const { data: vaccinationsData } = await supabase
          .from('vaccination_records')
          .select(`
            *,
            pet:pets(nome),
            vaccine:vaccines(nome, fabricante)
          `)
          .in('pet_id', petIds)
          .order('data_aplicacao', { ascending: false });

        setVaccinations(vaccinationsData || []);

        // Carregar prontuários médicos
        const { data: medicalData } = await supabase
          .from('medical_records')
          .select(`
            *,
            pet:pets(nome, especie)
          `)
          .in('pet_id', petIds)
          .order('created_at', { ascending: false });

        setMedicalRecords(medicalData || []);
      }

      // Carregar vendas/financeiro
      const { data: salesData } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items(*)
        `)
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });

      setSales(salesData || []);
    } catch (error) {
      console.error('Erro ao carregar dados do prontuário:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const formatDateOnly = (date: string) => {
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string }> = {
      agendado: { variant: "default", label: "Agendado" },
      em_andamento: { variant: "default", label: "Em Andamento" },
      concluido: { variant: "default", label: "Concluído" },
      cancelado: { variant: "destructive", label: "Cancelado" },
      faltou: { variant: "destructive", label: "Faltou" },
    };
    const config = statusMap[status] || { variant: "default", label: status };
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const handleAddPet = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userRole } = await supabase
        .from('user_roles')
        .select('clinic_id')
        .eq('user_id', user.id)
        .single();

      if (!userRole?.clinic_id) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível identificar a clínica.",
        });
        return;
      }

      const { error } = await supabase.from('pets').insert({
        client_id: client.id,
        clinic_id: userRole.clinic_id,
        nome: petForm.nome,
        especie: petForm.especie,
        raca: petForm.raca || null,
        sexo: petForm.sexo || null,
        nascimento: petForm.nascimento || null,
        cor: petForm.cor || null,
        castrado: petForm.castrado,
        microchip: petForm.microchip || null,
        alergias: petForm.alergias || null,
      });

      if (error) throw error;

      toast({
        title: "Pet cadastrado",
        description: `${petForm.nome} foi adicionado com sucesso!`,
      });

      setPetForm({
        nome: "",
        especie: "",
        raca: "",
        sexo: "",
        nascimento: "",
        cor: "",
        castrado: false,
        microchip: "",
        alergias: "",
      });
      setShowAddPetDialog(false);
      loadProntuarioData();
    } catch (error) {
      console.error('Erro ao adicionar pet:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível cadastrar o pet.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-2xl flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Prontuário Eletrônico - {client.nome}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="dados" className="flex-1 px-6 pb-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dados" className="gap-2">
              <User className="h-4 w-4" />
              Dados
            </TabsTrigger>
            <TabsTrigger value="pets" className="gap-2">
              <User className="h-4 w-4" />
              Pets
            </TabsTrigger>
            <TabsTrigger value="atendimentos" className="gap-2">
              <Calendar className="h-4 w-4" />
              Atendimentos
            </TabsTrigger>
            <TabsTrigger value="evolucao" className="gap-2">
              <Stethoscope className="h-4 w-4" />
              Evolução Médica
            </TabsTrigger>
            <TabsTrigger value="vacinas" className="gap-2">
              <Syringe className="h-4 w-4" />
              Vacinas
            </TabsTrigger>
            <TabsTrigger value="financeiro" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Financeiro
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(90vh-180px)] mt-4">
            {/* Aba Dados do Cliente */}
            <TabsContent value="dados" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Informações Pessoais</CardTitle>
                  <Button onClick={() => setShowAddPetDialog(true)} size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Pet
                  </Button>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome Completo</p>
                    <p className="font-medium">{client.nome}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CPF/CNPJ</p>
                    <p className="font-medium">{client.cpf_cnpj || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{client.email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium">{client.telefone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cadastrado em</p>
                    <p className="font-medium">{formatDate(client.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Pets</p>
                    <p className="font-medium">{pets.length}</p>
                  </div>
                </CardContent>
              </Card>

              {client.observacoes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Observações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{client.observacoes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Aba Pets */}
            <TabsContent value="pets" className="space-y-4">
              {pets.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Nenhum pet cadastrado
                  </CardContent>
                </Card>
              ) : (
                pets.map((pet) => (
                  <Card key={pet.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{pet.nome}</span>
                        <Badge>{pet.especie}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Raça</p>
                        <p className="font-medium">{pet.raca || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Sexo</p>
                        <p className="font-medium">{pet.sexo || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Cor</p>
                        <p className="font-medium">{pet.cor || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Nascimento</p>
                        <p className="font-medium">
                          {pet.nascimento ? formatDateOnly(pet.nascimento) : "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Castrado</p>
                        <p className="font-medium">{pet.castrado ? "Sim" : "Não"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Microchip</p>
                        <p className="font-medium">{pet.microchip || "-"}</p>
                      </div>
                      {pet.alergias && (
                        <div className="col-span-3">
                          <p className="text-sm text-muted-foreground">Alergias</p>
                          <p className="font-medium text-destructive">{pet.alergias}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Aba Atendimentos */}
            <TabsContent value="atendimentos" className="space-y-4">
              {appointments.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Nenhum atendimento registrado
                  </CardContent>
                </Card>
              ) : (
                appointments.map((appointment) => (
                  <Card key={appointment.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {formatDate(appointment.inicio)}
                        </CardTitle>
                        {getStatusBadge(appointment.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Pet</p>
                        <p className="font-medium">{appointment.pet?.nome}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Serviço</p>
                        <p className="font-medium">{appointment.service_type?.nome || "-"}</p>
                      </div>
                      {appointment.notas && (
                        <div>
                          <p className="text-sm text-muted-foreground">Observações</p>
                          <p className="text-sm">{appointment.notas}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Aba Evolução Médica */}
            <TabsContent value="evolucao" className="space-y-4">
              {medicalRecords.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Nenhum registro médico encontrado
                  </CardContent>
                </Card>
              ) : (
                medicalRecords.map((record) => (
                  <Card key={record.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {formatDate(record.created_at)}
                        </CardTitle>
                        <Badge>{record.tipo_atendimento}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Pet</p>
                        <p className="font-medium">{record.pet?.nome} - {record.pet?.especie}</p>
                      </div>
                      
                      <Separator />
                      
                      {record.soap && (
                        <div className="space-y-3">
                          <h4 className="font-semibold">Método SOAP</h4>
                          
                          {record.soap.subjetivo && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Subjetivo</p>
                              <p className="text-sm">{record.soap.subjetivo}</p>
                            </div>
                          )}
                          
                          {record.soap.objetivo && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Objetivo</p>
                              <p className="text-sm">{record.soap.objetivo}</p>
                            </div>
                          )}
                          
                          {record.soap.avaliacao && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Avaliação</p>
                              <p className="text-sm">{record.soap.avaliacao}</p>
                            </div>
                          )}
                          
                          {record.soap.plano && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Plano</p>
                              <p className="text-sm">{record.soap.plano}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Aba Vacinas */}
            <TabsContent value="vacinas" className="space-y-4">
              {pets.length > 0 ? (
                <VaccinationOCRUpload
                  petId={pets[0].id}
                  onSuccess={loadProntuarioData}
                />
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <p>É necessário cadastrar pelo menos um pet para usar o OCR de vacinas</p>
                  </CardContent>
                </Card>
              )}

              {vaccinations.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Nenhuma vacina registrada
                  </CardContent>
                </Card>
              ) : (
                vaccinations.map((vaccination) => (
                  <Card key={vaccination.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-lg">
                        <span>{vaccination.vaccine?.nome}</span>
                        <Badge>Dose {vaccination.dose}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Pet</p>
                        <p className="font-medium">{vaccination.pet?.nome}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Fabricante</p>
                        <p className="font-medium">{vaccination.vaccine?.fabricante || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Data de Aplicação</p>
                        <p className="font-medium">{formatDateOnly(vaccination.data_aplicacao)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Próxima Data</p>
                        <p className="font-medium">
                          {vaccination.proxima_data ? formatDateOnly(vaccination.proxima_data) : "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Lote</p>
                        <p className="font-medium">{vaccination.lote || "-"}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Aba Financeiro */}
            <TabsContent value="financeiro" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Resumo Financeiro</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Vendas</p>
                    <p className="text-2xl font-bold">{sales.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Total</p>
                    <p className="text-2xl font-bold">
                      R$ {sales.reduce((acc, sale) => acc + Number(sale.total_liquido), 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ticket Médio</p>
                    <p className="text-2xl font-bold">
                      R$ {sales.length > 0 
                        ? (sales.reduce((acc, sale) => acc + Number(sale.total_liquido), 0) / sales.length).toFixed(2)
                        : "0.00"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {sales.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Nenhuma venda registrada
                  </CardContent>
                </Card>
              ) : (
                sales.map((sale) => (
                  <Card key={sale.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {formatDate(sale.created_at)}
                        </CardTitle>
                        <Badge variant={sale.status === 'fechada' ? 'default' : 'destructive'}>
                          {sale.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Bruto</p>
                          <p className="font-medium">R$ {Number(sale.total_bruto).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Desconto</p>
                          <p className="font-medium">R$ {Number(sale.desconto || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Líquido</p>
                          <p className="font-medium text-lg">R$ {Number(sale.total_liquido).toFixed(2)}</p>
                        </div>
                      </div>
                      
                      {sale.sale_items && sale.sale_items.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Itens da Venda</p>
                          <div className="space-y-1">
                            {sale.sale_items.map((item: any) => (
                              <div key={item.id} className="flex justify-between text-sm">
                                <span>{item.descricao} (x{item.quantidade})</span>
                                <span className="font-medium">R$ {Number(item.total).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Dialog de Adicionar Pet */}
        <Dialog open={showAddPetDialog} onOpenChange={setShowAddPetDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Pet para {client.nome}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Pet *</Label>
                <Input
                  id="nome"
                  value={petForm.nome}
                  onChange={(e) => setPetForm({ ...petForm, nome: e.target.value })}
                  placeholder="Ex: Max"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="especie">Espécie *</Label>
                <Select value={petForm.especie} onValueChange={(value) => setPetForm({ ...petForm, especie: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cão">Cão</SelectItem>
                    <SelectItem value="Gato">Gato</SelectItem>
                    <SelectItem value="Ave">Ave</SelectItem>
                    <SelectItem value="Réptil">Réptil</SelectItem>
                    <SelectItem value="Roedor">Roedor</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="raca">Raça</Label>
                <Input
                  id="raca"
                  value={petForm.raca}
                  onChange={(e) => setPetForm({ ...petForm, raca: e.target.value })}
                  placeholder="Ex: SRD, Labrador"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sexo">Sexo</Label>
                <Select value={petForm.sexo} onValueChange={(value) => setPetForm({ ...petForm, sexo: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Macho">Macho</SelectItem>
                    <SelectItem value="Fêmea">Fêmea</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nascimento">Data de Nascimento</Label>
                <Input
                  id="nascimento"
                  type="date"
                  value={petForm.nascimento}
                  onChange={(e) => setPetForm({ ...petForm, nascimento: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cor">Cor</Label>
                <Input
                  id="cor"
                  value={petForm.cor}
                  onChange={(e) => setPetForm({ ...petForm, cor: e.target.value })}
                  placeholder="Ex: Preto, Caramelo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="microchip">Microchip</Label>
                <Input
                  id="microchip"
                  value={petForm.microchip}
                  onChange={(e) => setPetForm({ ...petForm, microchip: e.target.value })}
                  placeholder="Número do microchip"
                />
              </div>
              <div className="space-y-2 flex items-center gap-2 pt-8">
                <input
                  type="checkbox"
                  id="castrado"
                  checked={petForm.castrado}
                  onChange={(e) => setPetForm({ ...petForm, castrado: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="castrado">Pet castrado</Label>
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="alergias">Alergias / Observações</Label>
                <Input
                  id="alergias"
                  value={petForm.alergias}
                  onChange={(e) => setPetForm({ ...petForm, alergias: e.target.value })}
                  placeholder="Alergias, medicamentos, observações importantes"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddPetDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddPet} disabled={!petForm.nome || !petForm.especie}>
                Cadastrar Pet
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
