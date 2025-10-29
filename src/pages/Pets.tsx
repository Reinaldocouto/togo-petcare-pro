import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Search } from "lucide-react";
import { z } from "zod";

const petSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório").max(100),
  especie: z.string().min(1, "Espécie obrigatória"),
  client_id: z.string().uuid("Cliente obrigatório"),
  raca: z.string().optional(),
  sexo: z.string().optional(),
});

export default function Pets() {
  const [pets, setPets] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    especie: "",
    client_id: "",
    raca: "",
    sexo: "",
  });

  useEffect(() => {
    loadPets();
    loadClients();
  }, []);

  const loadPets = async () => {
    const { data, error } = await supabase
      .from('pets')
      .select('*, clients(nome)')
      .order('nome');

    if (!error) setPets(data || []);
  };

  const loadClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('id, nome')
      .order('nome');

    setClients(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validData = petSchema.parse(formData);
      setLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('clinic_id')
        .eq('user_id', userData.user?.id)
        .single();

      const { error } = await supabase
        .from('pets')
        .insert([{
          nome: validData.nome,
          especie: validData.especie,
          client_id: validData.client_id,
          raca: validData.raca || null,
          sexo: validData.sexo || null,
          clinic_id: userRole?.clinic_id,
        }]);

      if (error) throw error;

      toast({ title: "Pet cadastrado!" });
      setOpen(false);
      setFormData({ nome: "", especie: "", client_id: "", raca: "", sexo: "" });
      loadPets();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Dados inválidos",
          description: error.errors[0].message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredPets = pets.filter(p =>
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    p.especie.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pets</h1>
          <p className="text-muted-foreground">Gerencie os pacientes</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Pet
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Pet</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Tutor *</Label>
                <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tutor" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Pet *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="especie">Espécie *</Label>
                <Input
                  id="especie"
                  value={formData.especie}
                  onChange={(e) => setFormData({ ...formData, especie: e.target.value })}
                  placeholder="Ex: Cão, Gato"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="raca">Raça</Label>
                <Input
                  id="raca"
                  value={formData.raca}
                  onChange={(e) => setFormData({ ...formData, raca: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Sexo</Label>
                <Select value={formData.sexo} onValueChange={(value) => setFormData({ ...formData, sexo: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Macho</SelectItem>
                    <SelectItem value="F">Fêmea</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Salvando..." : "Salvar"}
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
              placeholder="Buscar pets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPets.map((pet) => (
              <Card key={pet.id}>
                <CardContent className="pt-6">
                  <h3 className="font-bold text-lg">{pet.nome}</h3>
                  <p className="text-sm text-muted-foreground">{pet.especie} - {pet.raca || "SRD"}</p>
                  <p className="text-sm text-muted-foreground mt-2">Tutor: {pet.clients?.nome}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
