import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, Plus, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format, addMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Appointment {
  id: string;
  inicio: string;
  fim: string;
  client_id: string;
  pet_id: string;
  service_type_id: string | null;
  status: string;
  notas: string | null;
  clients: { nome: string };
  pets: { nome: string };
  service_types: { nome: string } | null;
}

interface Client {
  id: string;
  nome: string;
}

interface Pet {
  id: string;
  nome: string;
  client_id: string;
}

interface ServiceType {
  id: string;
  nome: string;
  duracao_minutos: number;
  preco_base: number;
}

export default function Agenda() {
  const { user } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedPet, setSelectedPet] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [notes, setNotes] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (date) {
      loadAppointments();
    }
  }, [date]);

  const loadData = async () => {
    const { data: clientsData } = await supabase
      .from("clients")
      .select("id, nome")
      .order("nome");
    
    const { data: petsData } = await supabase
      .from("pets")
      .select("id, nome, client_id")
      .order("nome");
    
    const { data: servicesData } = await supabase
      .from("service_types")
      .select("id, nome, duracao_minutos, preco_base")
      .eq("ativo", true)
      .order("nome");

    if (clientsData) setClients(clientsData);
    if (petsData) setPets(petsData);
    if (servicesData) setServiceTypes(servicesData);
  };

  const handleClientChange = (clientId: string) => {
    setSelectedClient(clientId);
    setSelectedPet(""); // Reset pet when client changes
  };

  const loadAppointments = async () => {
    if (!date) return;

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id,
        inicio,
        fim,
        client_id,
        pet_id,
        service_type_id,
        status,
        notas,
        clients (nome),
        pets (nome),
        service_types (nome)
      `)
      .gte("inicio", startOfDay.toISOString())
      .lte("inicio", endOfDay.toISOString())
      .order("inicio");

    if (error) {
      toast.error("Erro ao carregar agendamentos");
    } else {
      setAppointments(data || []);
    }
  };

  const handleCreateAppointment = async () => {
    if (!date || !selectedClient || !selectedPet || !selectedTime) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("clinic_id")
      .eq("user_id", user?.id)
      .single();

    if (!userRoles) {
      toast.error("Erro ao obter informações da clínica");
      return;
    }

    const { data: location } = await supabase
      .from("locations")
      .select("id")
      .eq("clinic_id", userRoles.clinic_id)
      .single();

    if (!location) {
      toast.error("Nenhuma localização encontrada");
      return;
    }

    const [hours, minutes] = selectedTime.split(":").map(Number);
    const startDate = new Date(date);
    startDate.setHours(hours, minutes, 0, 0);

    const service = serviceTypes.find(s => s.id === selectedService);
    const duration = service?.duracao_minutos || 30;
    const endDate = addMinutes(startDate, duration);

    const { error } = await supabase
      .from("appointments")
      .insert({
        clinic_id: userRoles.clinic_id,
        location_id: location.id,
        client_id: selectedClient,
        pet_id: selectedPet,
        service_type_id: selectedService || null,
        inicio: startDate.toISOString(),
        fim: endDate.toISOString(),
        status: "agendado",
        notas: notes || null,
      });

    if (error) {
      toast.error("Erro ao criar agendamento");
    } else {
      toast.success("Agendamento criado com sucesso!");
      setIsDialogOpen(false);
      resetForm();
      loadAppointments();
    }
  };

  const resetForm = () => {
    setSelectedClient("");
    setSelectedPet("");
    setSelectedService("");
    setSelectedTime("09:00");
    setNotes("");
  };

  const filteredPets = pets.filter(pet => pet.client_id === selectedClient);

  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, "0");
    return [`${hour}:00`, `${hour}:30`];
  }).flat();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agenda</h1>
          <p className="text-muted-foreground">Gerencie seus agendamentos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Novo Agendamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Select value={selectedClient} onValueChange={handleClientChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Pet *</Label>
                <Select 
                  value={selectedPet} 
                  onValueChange={setSelectedPet} 
                  disabled={!selectedClient || filteredPets.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !selectedClient 
                        ? "Selecione primeiro o cliente" 
                        : filteredPets.length === 0 
                        ? "Este cliente não tem pets cadastrados" 
                        : "Selecione o pet"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredPets.map((pet) => (
                      <SelectItem key={pet.id} value={pet.id}>
                        {pet.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Serviço</Label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o serviço (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.nome} - {service.duracao_minutos}min
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Horário *</Label>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="h-60">
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações sobre o agendamento"
                  rows={3}
                />
              </div>

              <Button onClick={handleCreateAppointment} className="w-full">
                Criar Agendamento
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
              locale={ptBR}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Agendamentos - {date ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum agendamento para esta data</p>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {format(new Date(appointment.inicio), "HH:mm")} - {format(new Date(appointment.fim), "HH:mm")}
                          </span>
                        </div>
                        <p className="text-sm">
                          <span className="font-medium">{appointment.clients.nome}</span> - {appointment.pets.nome}
                        </p>
                        {appointment.service_types && (
                          <p className="text-sm text-muted-foreground">
                            {appointment.service_types.nome}
                          </p>
                        )}
                        {appointment.notas && (
                          <p className="text-sm text-muted-foreground italic">
                            {appointment.notas}
                          </p>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        appointment.status === "agendado" ? "bg-primary/20 text-primary" :
                        appointment.status === "concluido" ? "bg-green-500/20 text-green-700 dark:text-green-400" :
                        "bg-red-500/20 text-red-700 dark:text-red-400"
                      }`}>
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
