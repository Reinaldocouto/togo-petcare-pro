import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Activity, DollarSign, Edit } from "lucide-react";

interface FilaEsperaProps {
  appointments: any[];
  onViewRecord?: (apt: any) => void;
  onViewTriage?: (apt: any) => void;
  onViewFinancial?: (apt: any) => void;
  onEdit?: (apt: any) => void;
}

export function FilaEspera({ 
  appointments, 
  onViewRecord, 
  onViewTriage, 
  onViewFinancial, 
  onEdit 
}: FilaEsperaProps) {
  const [activeFilter, setActiveFilter] = useState<string>("todos");

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'agendado': return 'secondary';
      case 'em_andamento': return 'destructive';
      case 'concluido': return 'default';
      default: return 'outline';
    }
  };

  const filteredQueue = activeFilter === "todos" 
    ? appointments 
    : appointments.filter(apt => {
        const categoria = apt.service_types?.categoria?.toLowerCase();
        if (activeFilter === "laboratorio") return categoria === "exame";
        if (activeFilter === "consulta") return categoria === "consulta";
        if (activeFilter === "banho") return categoria === "banho" || categoria === "tosa";
        if (activeFilter === "cirurgia") return categoria === "cirurgia";
        return true;
      });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fila</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <Button 
            variant={activeFilter === "todos" ? "default" : "outline"}
            onClick={() => setActiveFilter("todos")}
          >
            TODOS
          </Button>
          <Button 
            variant={activeFilter === "laboratorio" ? "default" : "outline"}
            onClick={() => setActiveFilter("laboratorio")}
            className={activeFilter === "laboratorio" ? "" : ""}
          >
            LABORATÓRIO
          </Button>
          <Button 
            variant={activeFilter === "consulta" ? "default" : "outline"}
            onClick={() => setActiveFilter("consulta")}
            className={activeFilter === "consulta" ? "" : ""}
          >
            CONSULTA CLÍNICO
          </Button>
          <Button 
            variant={activeFilter === "banho" ? "default" : "outline"}
            onClick={() => setActiveFilter("banho")}
            className={activeFilter === "banho" ? "" : ""}
          >
            BANHO E TOSA
          </Button>
          <Button 
            variant={activeFilter === "cirurgia" ? "default" : "outline"}
            onClick={() => setActiveFilter("cirurgia")}
            className={activeFilter === "cirurgia" ? "" : ""}
          >
            CIRURGIA
          </Button>
        </div>

        {/* Tabela da Fila */}
        <div className="rounded-md border overflow-x-auto">
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
              {filteredQueue.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum atendimento na fila
                  </TableCell>
                </TableRow>
              ) : (
                filteredQueue.map((apt) => (
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
                        {onViewRecord && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 bg-primary hover:bg-primary/90 text-primary-foreground"
                            onClick={() => onViewRecord(apt)}
                            title="Prontuário do paciente"
                          >
                            <ClipboardList className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {/* Triagem */}
                        {onViewTriage && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 bg-primary hover:bg-primary/90 text-primary-foreground"
                            onClick={() => onViewTriage(apt)}
                            title="Dados de Triagem"
                          >
                            <Activity className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {/* Financeiro */}
                        {onViewFinancial && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                            onClick={() => onViewFinancial(apt)}
                            title="Resumo Financeiro"
                          >
                            <DollarSign className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {/* Editar */}
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-accent"
                            onClick={() => onEdit(apt)}
                            title="Editar Atendimento"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
