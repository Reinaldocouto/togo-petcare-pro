import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Package, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function Produtos() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sku: "",
    nome: "",
    categoria: "",
    preco_venda: "",
    custo: "",
    ncm: "",
    estoque_atual: "",
    estoque_minimo: "",
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('nome');
    
    setProducts(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: userRole } = await supabase
        .from('user_roles')
        .select('clinic_id')
        .eq('user_id', user.id)
        .single();

      if (!userRole) throw new Error("Clínica não encontrada");

      const { error } = await supabase.from('products').insert({
        clinic_id: userRole.clinic_id,
        sku: formData.sku,
        nome: formData.nome,
        categoria: formData.categoria || null,
        preco_venda: parseFloat(formData.preco_venda),
        custo: formData.custo ? parseFloat(formData.custo) : 0,
        ncm: formData.ncm || null,
        estoque_atual: formData.estoque_atual ? parseInt(formData.estoque_atual) : 0,
        estoque_minimo: formData.estoque_minimo ? parseInt(formData.estoque_minimo) : 0,
      });

      if (error) throw error;

      toast({ title: "Produto cadastrado com sucesso!" });
      setIsOpen(false);
      setFormData({
        sku: "",
        nome: "",
        categoria: "",
        preco_venda: "",
        custo: "",
        ncm: "",
        estoque_atual: "",
        estoque_minimo: "",
      });
      loadProducts();
    } catch (error: any) {
      toast({
        title: "Erro ao cadastrar produto",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.nome.toLowerCase().includes(search.toLowerCase()) ||
    product.sku.toLowerCase().includes(search.toLowerCase()) ||
    product.categoria?.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockProducts = products.filter(p => p.estoque_atual <= p.estoque_minimo);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Produtos e Estoque</h1>
        <p className="text-muted-foreground">Gestão de produtos e controle de estoque</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{lowStockProducts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Valor Total Estoque</CardTitle>
            <Package className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                products.reduce((sum, p) => sum + (p.estoque_atual * p.custo), 0)
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Catálogo de Produtos</CardTitle>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Produto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Cadastrar Produto</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>SKU *</Label>
                      <Input
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>NCM</Label>
                      <Input
                        value={formData.ncm}
                        onChange={(e) => setFormData({ ...formData, ncm: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Nome do Produto *</Label>
                    <Input
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label>Categoria</Label>
                    <Input
                      value={formData.categoria}
                      onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                      placeholder="ex: Vacinas, Ração, Medicamentos"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Custo (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.custo}
                        onChange={(e) => setFormData({ ...formData, custo: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Preço de Venda (R$) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.preco_venda}
                        onChange={(e) => setFormData({ ...formData, preco_venda: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Estoque Atual</Label>
                      <Input
                        type="number"
                        value={formData.estoque_atual}
                        onChange={(e) => setFormData({ ...formData, estoque_atual: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Estoque Mínimo</Label>
                      <Input
                        type="number"
                        value={formData.estoque_minimo}
                        onChange={(e) => setFormData({ ...formData, estoque_minimo: e.target.value })}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Cadastrando..." : "Cadastrar Produto"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, SKU ou categoria..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                  <TableCell className="font-medium">{product.nome}</TableCell>
                  <TableCell>{product.categoria || '-'}</TableCell>
                  <TableCell>
                    <span className={product.estoque_atual <= product.estoque_minimo ? 'text-warning font-semibold' : ''}>
                      {product.estoque_atual} / {product.estoque_minimo}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.preco_venda)}
                  </TableCell>
                  <TableCell>
                    {product.estoque_atual <= product.estoque_minimo ? (
                      <Badge variant="destructive">Estoque Baixo</Badge>
                    ) : product.ativo ? (
                      <Badge variant="default">Ativo</Badge>
                    ) : (
                      <Badge variant="secondary">Inativo</Badge>
                    )}
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
