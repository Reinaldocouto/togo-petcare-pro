import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export default function Config() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Configurações do sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configurações Gerais</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
