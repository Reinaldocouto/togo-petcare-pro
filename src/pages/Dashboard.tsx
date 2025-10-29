import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, DollarSign, AlertTriangle, TrendingUp, Activity, Package, Syringe } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function Dashboard() {
  const [stats, setStats] = useState({
    agendamentosHoje: 0,
    agendamentosSemana: 0,
    totalClientes: 0,
    totalPets: 0,
    faturamento30d: 0,
    faturamentoHoje: 0,
    produtosBaixoEstoque: 0,
    vacinasPendentes: 0,
    taxaOcupacao: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    seedAndLoadStats();
  }, []);

  const seedAndLoadStats = async () => {
    try {
      // First seed mock data if needed
      const { error: seedError } = await supabase.rpc('seed_mock_data');
      if (seedError && !seedError.message?.includes('already populated')) {
        console.error('Erro ao popular dados mock:', seedError);
      }
      
      // Then load stats
      await loadStats();
    } catch (error) {
      console.error('Erro no seed:', error);
    }
  };

  const loadStats = async () => {
    try {
      const hoje = new Date().toISOString().split('T')[0];
      const inicioSemana = new Date();
      inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
      const fimSemana = new Date(inicioSemana);
      fimSemana.setDate(fimSemana.getDate() + 6);
      
      const [appointments, appointmentsWeek, clients, pets, sales, salesToday, products, vaccines] = await Promise.all([
        supabase
          .from('appointments')
          .select('id', { count: 'exact' })
          .gte('inicio', `${hoje}T00:00:00`)
          .lt('inicio', `${hoje}T23:59:59`)
          .neq('status', 'cancelado'),
        
        supabase
          .from('appointments')
          .select('id', { count: 'exact' })
          .gte('inicio', inicioSemana.toISOString())
          .lte('inicio', fimSemana.toISOString())
          .neq('status', 'cancelado'),
        
        supabase
          .from('clients')
          .select('id', { count: 'exact' }),
        
        supabase
          .from('pets')
          .select('id', { count: 'exact' }),
        
        supabase
          .from('sales')
          .select('total_liquido')
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .eq('status', 'fechada'),
        
        supabase
          .from('sales')
          .select('total_liquido')
          .gte('created_at', `${hoje}T00:00:00`)
          .eq('status', 'fechada'),
        
        supabase
          .from('products')
          .select('*')
          .then(async (response) => {
            if (response.data) {
              const lowStock = response.data.filter(p => p.estoque_atual <= p.estoque_minimo);
              return { data: lowStock, count: lowStock.length, error: null };
            }
            return response;
          }),
        
        supabase
          .from('vaccination_records')
          .select('id', { count: 'exact' })
          .gte('proxima_data', hoje)
          .lte('proxima_data', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
      ]);

      const faturamento = sales.data?.reduce((sum, sale) => sum + Number(sale.total_liquido), 0) || 0;
      const faturamentoHoje = salesToday.data?.reduce((sum, sale) => sum + Number(sale.total_liquido), 0) || 0;

      // Taxa de ocupação (assumindo 10 horários por dia)
      const taxaOcupacao = appointmentsWeek.count ? Math.min((appointmentsWeek.count / (10 * 7)) * 100, 100) : 0;

      setStats({
        agendamentosHoje: appointments.count || 0,
        agendamentosSemana: appointmentsWeek.count || 0,
        totalClientes: clients.count || 0,
        totalPets: pets.count || 0,
        faturamento30d: faturamento,
        faturamentoHoje: faturamentoHoje,
        produtosBaixoEstoque: products.count || 0,
        vacinasPendentes: vaccines.count || 0,
        taxaOcupacao: Math.round(taxaOcupacao),
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral da sua clínica veterinária</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.agendamentosHoje}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.agendamentosSemana} esta semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Hoje</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.faturamentoHoje)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.faturamento30d)} em 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClientes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalPets} pets cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Alertas de Estoque</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.produtosBaixoEstoque}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Produtos abaixo do mínimo
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Taxa de Ocupação Semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{stats.taxaOcupacao}%</span>
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
              <Progress value={stats.taxaOcupacao} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Baseado em {stats.agendamentosSemana} agendamentos
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Syringe className="h-5 w-5 text-accent" />
              Vacinas Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{stats.vacinasPendentes}</div>
              <p className="text-xs text-muted-foreground">
                Próximos 7 dias - Enviar lembretes
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Gestão de Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-warning">{stats.produtosBaixoEstoque}</div>
              <p className="text-xs text-muted-foreground">
                Requer reposição urgente
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
