import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Syringe, Calendar, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Vacinas() {
  const [vaccines, setVaccines] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [vaccinesData, recordsData] = await Promise.all([
      supabase.from('vaccines').select('*').order('nome'),
      supabase
        .from('vaccination_records')
        .select('*, pets(nome, client_id, clients(nome)), vaccines(nome)')
        .order('data_aplicacao', { ascending: false }),
    ]);

    setVaccines(vaccinesData.data || []);
    setRecords(recordsData.data || []);

    // Filtrar vacinas pendentes (próximos 30 dias)
    const hoje = new Date();
    const em30Dias = new Date();
    em30Dias.setDate(em30Dias.getDate() + 30);

    const pendingRecords = (recordsData.data || []).filter(r => {
      if (!r.proxima_data) return false;
      const proximaData = new Date(r.proxima_data);
      return proximaData >= hoje && proximaData <= em30Dias;
    });

    setPending(pendingRecords);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Controle de Vacinas</h1>
        <p className="text-muted-foreground">Gestão vacinal e lembretes</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vacinas Cadastradas</CardTitle>
            <Syringe className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vaccines.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aplicações (30d)</CardTitle>
            <Calendar className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {records.filter(r => {
                const data = new Date(r.data_aplicacao);
                const hoje = new Date();
                const diff = (hoje.getTime() - data.getTime()) / (1000 * 60 * 60 * 24);
                return diff <= 30;
              }).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendentes/Vencendo</CardTitle>
            <AlertCircle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{pending.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="catalog" className="space-y-4">
        <TabsList>
          <TabsTrigger value="catalog">Catálogo de Vacinas</TabsTrigger>
          <TabsTrigger value="records">Histórico</TabsTrigger>
          <TabsTrigger value="pending">
            Pendentes
            {pending.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pending.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalog">
          <Card>
            <CardHeader>
              <CardTitle>Vacinas Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Fabricante</TableHead>
                    <TableHead>Doses</TableHead>
                    <TableHead>Intervalo (dias)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vaccines.map((vaccine) => (
                    <TableRow key={vaccine.id}>
                      <TableCell className="font-medium">{vaccine.nome}</TableCell>
                      <TableCell>{vaccine.fabricante || '-'}</TableCell>
                      <TableCell>{vaccine.doses}</TableCell>
                      <TableCell>{vaccine.intervalo_dias || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Aplicações</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Pet</TableHead>
                    <TableHead>Tutor</TableHead>
                    <TableHead>Vacina</TableHead>
                    <TableHead>Dose</TableHead>
                    <TableHead>Próxima</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.slice(0, 50).map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {format(new Date(record.data_aplicacao), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="font-medium">{record.pets?.nome}</TableCell>
                      <TableCell>{record.pets?.clients?.nome}</TableCell>
                      <TableCell>{record.vaccines?.nome}</TableCell>
                      <TableCell>{record.dose}ª dose</TableCell>
                      <TableCell>
                        {record.proxima_data ? (
                          format(new Date(record.proxima_data), "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                          <Badge variant="secondary">Completo</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-warning" />
                Vacinas Pendentes - Próximos 30 Dias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Pet</TableHead>
                    <TableHead>Tutor</TableHead>
                    <TableHead>Vacina</TableHead>
                    <TableHead>Dose</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pending.map((record) => {
                    const diasRestantes = Math.ceil(
                      (new Date(record.proxima_data).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                    );
                    return (
                      <TableRow key={record.id}>
                        <TableCell className="font-semibold">
                          {format(new Date(record.proxima_data), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="font-medium">{record.pets?.nome}</TableCell>
                        <TableCell>{record.pets?.clients?.nome}</TableCell>
                        <TableCell>{record.vaccines?.nome}</TableCell>
                        <TableCell>{record.dose + 1}ª dose</TableCell>
                        <TableCell>
                          {diasRestantes <= 7 ? (
                            <Badge variant="destructive">Urgente ({diasRestantes}d)</Badge>
                          ) : (
                            <Badge variant="secondary">{diasRestantes} dias</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
