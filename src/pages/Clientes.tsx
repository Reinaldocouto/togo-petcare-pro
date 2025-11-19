import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, FileText, Trash2 } from "lucide-react";
import { z } from "zod";
import { ProntuarioEletronico } from "@/components/ProntuarioEletronico";

const clientSchema = z.object({
  nome: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").max(100),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefone: z.string().min(10, "Telefone inválido").max(20),
  cpf_cnpj: z.string().optional(),
  observacoes: z.string().optional(),
  endereco: z.object({
    rua: z.string().optional(),
    numero: z.string().optional(),
    complemento: z.string().optional(),
    bairro: z.string().optional(),
    cidade: z.string().optional(),
    estado: z.string().optional(),
    cep: z.string().optional(),
  }).optional(),
});

const petSchema = z.object({
  nome: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  especie: z.string().min(1, "Espécie é obrigatória"),
  raca: z.string().optional(),
  sexo: z.string().optional(),
  nascimento: z.string().optional(),
  castrado: z.boolean().optional(),
  cor: z.string().optional(),
  microchip: z.string().optional(),
  alergias: z.string().optional(),
});

export default function Clientes() {
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [selectedClientForProntuario, setSelectedClientForProntuario] = useState<any>(null);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    cpf_cnpj: "",
    observacoes: "",
    endereco: {
      rua: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
      cep: "",
    },
  });
  
  const [pets, setPets] = useState<any[]>([]);
  const [currentPet, setCurrentPet] = useState({
    nome: "",
    especie: "",
    raca: "",
    sexo: "",
    nascimento: "",
    castrado: false,
    cor: "",
    microchip: "",
    alergias: "",
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('nome');

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar clientes",
        description: error.message,
      });
    } else {
      setClients(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validData = clientSchema.parse(formData);
      setLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('clinic_id')
        .eq('user_id', userData.user?.id)
        .single();

      if (editingClient) {
        // Atualizar cliente existente
        const { error } = await supabase
          .from('clients')
          .update({
            nome: validData.nome,
            email: validData.email || null,
            telefone: validData.telefone,
            cpf_cnpj: validData.cpf_cnpj,
          })
          .eq('id', editingClient.id);

        if (error) throw error;

        toast({
          title: "Cliente atualizado!",
          description: "Dados atualizados com sucesso",
        });
      } else {
        // Criar novo cliente
        const { error } = await supabase
          .from('clients')
          .insert([{
            nome: validData.nome,
            email: validData.email || null,
            telefone: validData.telefone,
            cpf_cnpj: validData.cpf_cnpj,
            clinic_id: userRole?.clinic_id,
          }]);

        if (error) throw error;

        toast({
          title: "Cliente cadastrado!",
          description: "Cliente adicionado com sucesso",
        });
      }

      setOpen(false);
      setFormData({ nome: "", email: "", telefone: "", cpf_cnpj: "" });
      setEditingClient(null);
      loadClients();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Dados inválidos",
          description: error.errors[0].message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao cadastrar",
          description: "Tente novamente",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (client: any) => {
    setEditingClient(client);
    setFormData({
      nome: client.nome,
      email: client.email || "",
      telefone: client.telefone || "",
      cpf_cnpj: client.cpf_cnpj || "",
      observacoes: client.observacoes || "",
      endereco: client.endereco || {
        rua: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        estado: "",
        cep: "",
      },
    });
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingClient(null);
    setPets([]);
    setFormData({ 
      nome: "", 
      email: "", 
      telefone: "", 
      cpf_cnpj: "",
      observacoes: "",
      endereco: {
        rua: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        estado: "",
        cep: "",
      },
    });
  };

  const filteredClients = clients.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.telefone?.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">Gerencie seus clientes</p>
        </div>
        <Dialog open={open} onOpenChange={handleCloseDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingClient ? "Editar Cliente" : "Cadastrar Cliente"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Tabs defaultValue="dados" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
                  <TabsTrigger value="endereco">Endereço</TabsTrigger>
                  <TabsTrigger value="pets">Pets ({pets.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="dados" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="nome">Nome completo *</Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone *</Label>
                      <Input
                        id="telefone"
                        value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                        placeholder="(00) 00000-0000"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="exemplo@email.com"
                      />
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
                      <Input
                        id="cpf_cnpj"
                        value={formData.cpf_cnpj}
                        onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })}
                        placeholder="000.000.000-00"
                      />
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="observacoes">Observações</Label>
                      <Textarea
                        id="observacoes"
                        value={formData.observacoes}
                        onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                        placeholder="Informações adicionais sobre o cliente..."
                        rows={3}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="endereco" className="space-y-4 mt-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2 col-span-3">
                      <Label htmlFor="rua">Rua</Label>
                      <Input
                        id="rua"
                        value={formData.endereco.rua}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          endereco: { ...formData.endereco, rua: e.target.value }
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="numero">Número</Label>
                      <Input
                        id="numero"
                        value={formData.endereco.numero}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          endereco: { ...formData.endereco, numero: e.target.value }
                        })}
                      />
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="complemento">Complemento</Label>
                      <Input
                        id="complemento"
                        value={formData.endereco.complemento}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          endereco: { ...formData.endereco, complemento: e.target.value }
                        })}
                        placeholder="Apto, Bloco, etc."
                      />
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="bairro">Bairro</Label>
                      <Input
                        id="bairro"
                        value={formData.endereco.bairro}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          endereco: { ...formData.endereco, bairro: e.target.value }
                        })}
                      />
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="cidade">Cidade</Label>
                      <Input
                        id="cidade"
                        value={formData.endereco.cidade}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          endereco: { ...formData.endereco, cidade: e.target.value }
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="estado">Estado</Label>
                      <Input
                        id="estado"
                        value={formData.endereco.estado}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          endereco: { ...formData.endereco, estado: e.target.value }
                        })}
                        placeholder="UF"
                        maxLength={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cep">CEP</Label>
                      <Input
                        id="cep"
                        value={formData.endereco.cep}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          endereco: { ...formData.endereco, cep: e.target.value }
                        })}
                        placeholder="00000-000"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="pets" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Adicionar Pet</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="pet-nome">Nome do Pet *</Label>
                          <Input
                            id="pet-nome"
                            value={currentPet.nome}
                            onChange={(e) => setCurrentPet({ ...currentPet, nome: e.target.value })}
                            placeholder="Nome do pet"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="pet-especie">Espécie *</Label>
                          <Select
                            value={currentPet.especie}
                            onValueChange={(value) => setCurrentPet({ ...currentPet, especie: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
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
                          <Label htmlFor="pet-raca">Raça</Label>
                          <Input
                            id="pet-raca"
                            value={currentPet.raca}
                            onChange={(e) => setCurrentPet({ ...currentPet, raca: e.target.value })}
                            placeholder="Ex: SRD, Labrador..."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="pet-sexo">Sexo</Label>
                          <Select
                            value={currentPet.sexo}
                            onValueChange={(value) => setCurrentPet({ ...currentPet, sexo: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Macho">Macho</SelectItem>
                              <SelectItem value="Fêmea">Fêmea</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="pet-nascimento">Data de Nascimento</Label>
                          <Input
                            id="pet-nascimento"
                            type="date"
                            value={currentPet.nascimento}
                            onChange={(e) => setCurrentPet({ ...currentPet, nascimento: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="pet-cor">Cor</Label>
                          <Input
                            id="pet-cor"
                            value={currentPet.cor}
                            onChange={(e) => setCurrentPet({ ...currentPet, cor: e.target.value })}
                            placeholder="Ex: Caramelo, Preto..."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="pet-microchip">Microchip</Label>
                          <Input
                            id="pet-microchip"
                            value={currentPet.microchip}
                            onChange={(e) => setCurrentPet({ ...currentPet, microchip: e.target.value })}
                            placeholder="Número do microchip"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={currentPet.castrado}
                              onChange={(e) => setCurrentPet({ ...currentPet, castrado: e.target.checked })}
                              className="rounded"
                            />
                            Castrado
                          </Label>
                        </div>

                        <div className="space-y-2 col-span-2">
                          <Label htmlFor="pet-alergias">Alergias / Observações</Label>
                          <Textarea
                            id="pet-alergias"
                            value={currentPet.alergias}
                            onChange={(e) => setCurrentPet({ ...currentPet, alergias: e.target.value })}
                            placeholder="Informações sobre alergias ou observações importantes..."
                            rows={2}
                          />
                        </div>
                      </div>

                      <Button
                        type="button"
                        onClick={handleAddPet}
                        variant="outline"
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Pet à Lista
                      </Button>
                    </CardContent>
                  </Card>

                  {pets.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Pets Cadastrados ({pets.length})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {pets.map((pet, index) => (
                            <div key={pet.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex-1">
                                <p className="font-semibold">{pet.nome}</p>
                                <p className="text-sm text-muted-foreground">
                                  {pet.especie} {pet.raca && `• ${pet.raca}`} {pet.sexo && `• ${pet.sexo}`}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemovePet(pet.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={handleCloseDialog} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Salvando..." : editingClient ? "Atualizar Cliente" : "Salvar Cliente"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>CPF/CNPJ</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.nome}</TableCell>
                  <TableCell>{client.telefone}</TableCell>
                  <TableCell>{client.email || "-"}</TableCell>
                  <TableCell>{client.cpf_cnpj || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(client)}
                        className="h-8 w-8"
                        title="Editar cliente"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedClientForProntuario(client)}
                        className="h-8 w-8"
                        title="Prontuário Eletrônico"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedClientForProntuario && (
        <ProntuarioEletronico
          client={selectedClientForProntuario}
          open={!!selectedClientForProntuario}
          onClose={() => setSelectedClientForProntuario(null)}
        />
      )}
    </div>
  );
}
