import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, Pencil } from "lucide-react";
import { z } from "zod";

const clientSchema = z.object({
  nome: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").max(100),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefone: z.string().min(10, "Telefone inválido").max(20),
  cpf_cnpj: z.string().optional(),
});

export default function Clientes() {
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    cpf_cnpj: "",
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
    });
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingClient(null);
    setFormData({ nome: "", email: "", telefone: "", cpf_cnpj: "" });
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingClient ? "Editar Cliente" : "Cadastrar Cliente"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
                <Input
                  id="cpf_cnpj"
                  value={formData.cpf_cnpj}
                  onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Salvando..." : editingClient ? "Atualizar" : "Salvar"}
              </Button>
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(client)}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
