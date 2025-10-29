import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, DollarSign, AlertTriangle } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    agendamentosHoje: 0,
    totalClientes: 0,
    faturamento30d: 0,
    produtosBaixoEstoque: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const hoje = new Date().toISOString().split('T')[0];
    
    const [appointments, clients, sales, products] = await Promise.all([
      supabase
        .from('appointments')
        .select('id', { count: 'exact' })
        .gte('inicio', `${hoje}T00:00:00`)
        .lt('inicio', `${hoje}T23:59:59`),
      
      supabase
        .from('clients')
        .select('id', { count: 'exact' }),
      
      supabase
        .from('sales')
        .select('total_liquido')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      
      supabase
        .from('products')
        .select('id', { count: 'exact' })
        .filter('estoque_atual', 'lte', 'estoque_minimo'),
    ]);

    const faturamento = sales.data?.reduce((sum, sale) => sum + Number(sale.total_liquido), 0) || 0;

    setStats({
      agendamentosHoje: appointments.count || 0,
      totalClientes: clients.count || 0,
      faturamento30d: faturamento,
      produtosBaixoEstoque: products.count || 0,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral da sua clínica</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.agendamentosHoje}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClientes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Faturamento (30d)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.faturamento30d)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Alertas de Estoque</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.produtosBaixoEstoque}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
