import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, DollarSign, AlertTriangle, TrendingUp, Activity, Package, Syringe } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { FilaEspera } from "@/components/FilaEspera";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

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
  const [queueAppointments, setQueueAppointments] = useState<any[]>([]);

  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [viewRecordOpen, setViewRecordOpen] = useState(false);
  const [triageOpen, setTriageOpen] = useState(false);
  const [financialOpen, setFinancialOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

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
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('profiles').select('nome').eq('id', user?.id || '').single();
      const veterinario = profile?.nome || 'Dr. Veterinário';

      const hoje = new Date().toISOString().split('T')[0];
      const inicioSemana = new Date();
      inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
      const fimSemana = new Date(inicioSemana);
      fimSemana.setDate(fimSemana.getDate() + 6);
      
      const [appointments, appointmentsWeek, clients, pets, sales, salesToday, products, vaccines, queueRes] = await Promise.all([
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
        
        supabase
          .from('appointments')
          .select('*, pets(nome, especie), clients(nome), service_types(nome, categoria)')
          .gte('inicio', new Date().toISOString().split('T')[0])
          .order('inicio')
          .limit(50)
      ]);

      const faturamento = sales.data?.reduce((sum, sale) => sum + Number(sale.total_liquido), 0) || 0;
      const faturamentoHoje = salesToday.data?.reduce((sum, sale) => sum + Number(sale.total_liquido), 0) || 0;

      // Taxa de ocupação (assumindo 10 horários por dia)
      const taxaOcupacao = appointmentsWeek.count ? Math.min((appointmentsWeek.count / (10 * 7)) * 100, 100) : 0;

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

      <Separator className="my-8" />

      <FilaEspera 
        appointments={queueAppointments}
        onViewRecord={(apt) => { setSelectedAppointment(apt); setViewRecordOpen(true); }}
        onViewTriage={(apt) => { setSelectedAppointment(apt); setTriageOpen(true); }}
        onViewFinancial={(apt) => { setSelectedAppointment(apt); setFinancialOpen(true); }}
        onEdit={(apt) => { setSelectedAppointment(apt); setEditOpen(true); }}
      />

      {/* Modais de ação da Fila */}
      <Dialog open={viewRecordOpen} onOpenChange={setViewRecordOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Prontuário do Paciente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Cliente</Label>
                <p className="font-medium">{selectedAppointment?.clients?.nome}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Pet</Label>
                <p className="font-medium">{selectedAppointment?.pets?.nome}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Procedimento</Label>
                <p className="font-medium">{selectedAppointment?.service_types?.nome}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Hora</Label>
                <p className="font-medium">{selectedAppointment?.hora}</p>
              </div>
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea placeholder="Observações do atendimento..." rows={3} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setViewRecordOpen(false)}>Fechar</Button>
              <Button onClick={() => setViewRecordOpen(false)}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={triageOpen} onOpenChange={setTriageOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dados de Triagem</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Temperatura (°C)</Label>
              <Input type="number" step="0.1" placeholder="38.5" />
            </div>
            <div>
              <Label>Frequência Cardíaca (bpm)</Label>
              <Input type="number" placeholder="120" />
            </div>
            <div>
              <Label>Frequência Respiratória (rpm)</Label>
              <Input type="number" placeholder="30" />
            </div>
            <div>
              <Label>Peso (kg)</Label>
              <Input type="number" step="0.1" placeholder="5.5" />
            </div>
            <div className="col-span-2">
              <Label>Observações</Label>
              <Textarea rows={3} placeholder="Mucosas róseas, TPC < 2s..." />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setTriageOpen(false)}>Cancelar</Button>
            <Button onClick={() => setTriageOpen(false)}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={financialOpen} onOpenChange={setFinancialOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Resumo Financeiro</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cliente:</span>
              <span className="font-medium">{selectedAppointment?.clients?.nome}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pet:</span>
              <span className="font-medium">{selectedAppointment?.pets?.nome}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Procedimento:</span>
              <span className="font-medium">{selectedAppointment?.service_types?.nome}</span>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={() => setFinancialOpen(false)}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Atendimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Status</Label>
              <Input defaultValue={selectedAppointment?.status} />
            </div>
            <div>
              <Label>Horário</Label>
              <Input defaultValue={selectedAppointment?.hora} />
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea rows={3} placeholder="Observações..." />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
              <Button onClick={() => setEditOpen(false)}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
